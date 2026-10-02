#!/usr/bin/env bash
# Every screen, every click (docs/QA.md): opens every designed screen of the desk website and the field app as its
# persona, follows every designed link, and activates every control, against the running stack.
#
#   tools/qa/test-screens.sh                 both specs (designed links + every control)
#   tools/qa/test-screens.sh links           every designed link only   (specs/clicks/designed-links.spec.ts)
#   tools/qa/test-screens.sh controls        every control only         (specs/clicks/every-control.spec.ts)
#   tools/qa/test-screens.sh walkthrough     both specs, README judge-walkthrough screens only
#   tools/qa/test-screens.sh all --grep @dispatcher      extra arguments go to `playwright test`
#
# Env: E2E_BASE_URL (default https://localhost:8443; set the Azure URL to test the deployed demo, with
#      E2E_PASSWORD / E2E_PASSWORD_ADMIN if its passwords differ), E2E_CLICKS_WORKERS (4), E2E_CLICKS_ONLY=<regex>,
#      E2E_CLICKS_APP=desk|field, E2E_CLICKS_LIVE=1, E2E_OPEN_REPORT=1 (serve the HTML report when done).
set -uo pipefail
cd "$(dirname "$0")/../.."
root=$(pwd)

what=${1:-all}
[ $# -gt 0 ] && shift
spec=()
grep=()
case "$what" in
  all) ;;
  links) spec=(specs/clicks/designed-links.spec.ts) ;;
  controls) spec=(specs/clicks/every-control.spec.ts) ;;
  walkthrough) grep=(--grep @walkthrough) ;;
  -*) set -- "$what" "$@"; what=all ;;
  *) echo "usage: $0 [all|links|controls|walkthrough] [playwright args…]"; exit 2 ;;
esac

base=${E2E_BASE_URL:-https://localhost:8443}
echo "== stack: $base"
if [[ "$base" == *localhost* || "$base" == *127.0.0.1* ]]; then
  tools/qa/wait-stack.sh "${E2E_WAIT_SECONDS:-300}" || { echo "The stack is not up. Start it with: docker compose up -d --build"; exit 1; }
else
  for p in "/" "/auth/realms/lodestar/.well-known/openid-configuration"; do
    curl -ksf -o /dev/null --max-time 20 "$base$p" || { echo "$base$p does not answer"; exit 1; }
  done
  code=$(curl -ks -o /dev/null -w '%{http_code}' --max-time 20 "$base/odata/v4/\$metadata")
  [[ "$code" =~ ^(200|401)$ ]] || { echo "$base/odata/v4 answers $code"; exit 1; }
  echo "stack ready"
fi

cd tests/e2e
[ -d node_modules/@playwright/test ] || npm ci
npx playwright install chromium >/dev/null
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tools/gen-clicks-manifest.mts

workers=${E2E_CLICKS_WORKERS:-4}
echo "== playwright test --project=clicks --workers=$workers ${spec[*]} ${grep[*]} $*"
E2E_REQUIRE_STACK=1 npx playwright test --project=clicks --workers="$workers" "${spec[@]}" "${grep[@]}" "$@"
status=$?

report="$root/tests/e2e/reports/html/index.html"
echo
echo "HTML report: $report"
echo "  open it:   cd tests/e2e && npx playwright show-report reports/html     (or: npm run report)"
echo "  JUnit:     $root/tests/e2e/reports/junit.xml"
if [ "${E2E_OPEN_REPORT:-0}" = 1 ]; then npx playwright show-report reports/html; fi
exit $status
