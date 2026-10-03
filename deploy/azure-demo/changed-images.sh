#!/usr/bin/env bash
# Which of the 16 images a push needs rebuilt, as a JSON matrix for .github/workflows/deploy-demo.yml:
#   BEFORE=<sha> deploy/azure-demo/changed-images.sh      → matrix=[{"name":"orders","context":"backend",...}, ...]
# Everything is rebuilt when ALL=true, when the range is unknown (first push, force push) or when this pipeline
# itself changed. Docs and tests never trigger a build.
set -euo pipefail
cd "$(dirname "$0")/../.."

all=${ALL:-false}
before=${BEFORE:-}
files=""
if [[ "$all" != true && -n "$before" && ! "$before" =~ ^0+$ ]] && git cat-file -e "${before}^{commit}" 2>/dev/null; then
  files=$(git diff --name-only "$before" HEAD)
else
  all=true
fi
grep -qE '^(\.github/workflows/deploy-demo\.yml|deploy/azure-demo/changed-images\.sh)$' <<<"$files" && all=true
relevant=$(grep -vE '(\.md$|/__tests__/|/cypress/|\.spec\.tsx?$|\.test\.tsx?$|^backend/test/|^backend/apps/agent/tests/|^backend/apps/ml/tests/)' <<<"$files" || true)

want() { [[ "$all" == true ]] || grep -qE "$1" <<<"$relevant"; }
out=()
add() { out+=("{\"name\":\"$1\",\"context\":\"$2\",\"file\":\"$3\"}"); }

# the NestJS images share libs/, the Prisma schema and the lockfile (backend/.dockerignore keeps agent and gateway out)
shared='^backend/(libs/|prisma/|package(-lock)?\.json$|tsconfig[^/]*\.json$|nest-cli\.json$)'
want "$shared|^backend/Dockerfile\.migrate$" && add migrate backend backend/Dockerfile.migrate
for s in auth orders planning fleet outlets trips sync notifications audit; do
  want "$shared|^backend/apps/$s/" && add "$s" backend "backend/apps/$s/Dockerfile"
done
want '^backend/apps/agent/' && add agent backend/apps/agent backend/apps/agent/Dockerfile
want '^backend/apps/ocr/' && add ocr backend/apps/ocr backend/apps/ocr/Dockerfile
want '^backend/apps/ml/' && add ml backend/apps/ml backend/apps/ml/Dockerfile
# the gateway is rebuilt on every deploy (small image): its /version must name the commit that is live
add gateway backend/apps/gateway backend/apps/gateway/Dockerfile
want '^frontend/' && add frontend frontend frontend/Dockerfile
want '^mobile/' && add mobile-web mobile mobile/Dockerfile
# Keycloak + the Lodestar sign-in extension (the realm JSON is mounted, not baked in)
want '^backend/identity/(Dockerfile|extension/)' && add identity backend/identity backend/identity/Dockerfile

echo "matrix=[$(IFS=,; echo "${out[*]}")]" >> "${GITHUB_OUTPUT:-/dev/stdout}"
