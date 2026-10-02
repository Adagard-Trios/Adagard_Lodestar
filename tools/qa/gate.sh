#!/usr/bin/env bash
# The whole quality gate on one machine, the same stages as CI (.circleci/config.yml):
#   1. lint + typecheck   2. unit suites (+ coverage)   3. backend integration (real Postgres)
#   4. full stack: docker compose up from scratch, Playwright (api, web, mobile, flows, clicks, visual)
#   5. SonarQube scan against the local server (compose `qa` profile), waiting for the gate
#
#   tools/qa/gate.sh              everything
#   tools/qa/gate.sh --no-stack   stages 1–3 and 5 (no compose rebuild)
#   tools/qa/gate.sh --no-sonar   skip stage 5
# Needs: Node 22, Python 3.12, Docker. Stage 5 needs SONAR_TOKEN (docs/QA.md "Local SonarQube").
set -euo pipefail
cd "$(dirname "$0")/../.."
STACK=1; SONAR=1
for a in "$@"; do case $a in --no-stack) STACK=0 ;; --no-sonar) SONAR=0 ;; esac; done
step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
failed=()
run() { local name=$1; shift; step "$name"; if "$@"; then echo "PASS $name"; else echo "FAIL $name"; failed+=("$name"); fi; }

run "data-model doc"   node tools/docs/erd.mjs --check
run "frontend lint"        bash -c 'cd frontend && npm run lint'
run "frontend typecheck"   bash -c 'cd frontend && npm run typecheck'
run "mobile typecheck"     bash -c 'cd mobile && npx tsc --noEmit'
run "backend lint"         bash -c 'cd backend && npm run lint'
run "backend typecheck"    bash -c 'cd backend && npm run typecheck'

run "backend jest"         bash -c 'cd backend && npx jest --ci --coverage'
run "frontend jest"        bash -c 'cd frontend && npx jest --ci --coverage'
run "mobile jest"          bash -c 'cd mobile && npx jest --ci --coverage --coverageReporters=lcov --coverageReporters=text-summary'
run "agent pytest"         bash -c 'cd backend/apps/agent && mkdir -p reports && python -m pytest --junitxml=reports/pytest.xml --cov=lodestar_agent --cov-report=xml:coverage.xml'
run "frontend cypress"     bash -c 'cd frontend && npm run build && npm run e2e:ci'

# integration tests need a Postgres of their own: a throwaway container, database lodestar_test (never the app's)
run "backend integration"  bash -c '
  docker inspect lodestar-inttest-pg >/dev/null 2>&1 || docker run -d --name lodestar-inttest-pg     -e POSTGRES_USER=lodestar -e POSTGRES_PASSWORD=lodestar-dev-only -e POSTGRES_DB=lodestar_test     -p 127.0.0.1:55432:5432 postgres:16-alpine >/dev/null
  docker start lodestar-inttest-pg >/dev/null
  until docker exec lodestar-inttest-pg pg_isready -U lodestar -d lodestar_test >/dev/null 2>&1; do sleep 1; done
  cd backend && DATABASE_URL=postgresql://lodestar:lodestar-dev-only@127.0.0.1:55432/lodestar_test npm run test:int -- --ci'

if [ $STACK = 1 ]; then
  run "full stack up"      bash -c 'docker compose down -v --remove-orphans && docker compose up -d --build && tools/qa/wait-stack.sh 900'
  run "playwright"         bash -c 'cd tests/e2e && E2E_REQUIRE_STACK=1 E2E_KEYCLOAK_URL=https://localhost:8443/auth \
      E2E_ISSUER=https://localhost:8443/auth/realms/lodestar NODE_TLS_REJECT_UNAUTHORIZED=0 E2E_AGENT_CLIENT_SECRET=svc-agent-dev-only \
      npx playwright test --project=api --project=web-chromium --project=mobile-web --project=flows --project=clicks --project=visual'
fi

if [ $SONAR = 1 ]; then
  run "sonar + gate"       bash -c '
    : "${SONAR_TOKEN:?set SONAR_TOKEN (docs/QA.md Local SonarQube)}"
    docker compose --profile qa up -d sonarqube >/dev/null
    until curl -fs http://localhost:9000/api/system/status | grep -q "\"UP\""; do sleep 3; done
    SONAR_HOST_URL=http://localhost:9000 tools/qa/sonar-gate.sh
    npx -y sonarqube-scanner@4 -Dsonar.host.url=http://localhost:9000 -Dsonar.token="$SONAR_TOKEN" -Dsonar.qualitygate.wait=true'
fi

step "summary"
if [ ${#failed[@]} -eq 0 ]; then echo "gate PASSED"; else printf 'gate FAILED: %s\n' "${failed[@]}"; exit 1; fi
