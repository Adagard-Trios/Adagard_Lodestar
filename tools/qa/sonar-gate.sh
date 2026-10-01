#!/usr/bin/env bash
# Creates (or updates) the "Lodestar" quality gate and makes it the project's gate.
#   local:  SONAR_HOST_URL=http://localhost:9000 SONAR_TOKEN=<admin token> tools/qa/sonar-gate.sh
#   cloud:  SONAR_HOST_URL=https://sonarcloud.io SONAR_TOKEN=<token> SONAR_ORGANIZATION=<org> \
#           SONAR_PROJECT_KEY=<key> tools/qa/sonar-gate.sh
set -euo pipefail
host=${SONAR_HOST_URL:-http://localhost:9000}
project=${SONAR_PROJECT_KEY:-waypoint-lodestar}
gate=Lodestar
org=${SONAR_ORGANIZATION:+organization=$SONAR_ORGANIZATION}
api() { curl -fsS -u "$SONAR_TOKEN:" -X "$1" "$host/api/$2${org:+&$org}"; }

api GET "qualitygates/show?name=$gate" >/dev/null 2>&1 || api POST "qualitygates/create?name=$gate" >/dev/null
# replace the gate's conditions with ours
for id in $(api GET "qualitygates/show?name=$gate" | grep -o '"id":"[^"]*"' | cut -d'"' -f4); do
  api POST "qualitygates/delete_condition?id=$id" >/dev/null || true
done
cond() { api POST "qualitygates/create_condition?gateName=$gate&metric=$1&op=$2&error=$3" >/dev/null; echo "  $1 $2 $3"; }
echo "gate $gate:"
cond new_bugs GT 0
cond new_vulnerabilities GT 0
cond new_blocker_violations GT 0
cond new_critical_violations GT 0
cond new_coverage LT 80
cond new_duplicated_lines_density GT 3
api POST "qualitygates/select?gateName=$gate&projectKey=$project" >/dev/null
echo "selected for $project"
