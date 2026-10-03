#!/usr/bin/env bash
# Builds the 15 images on THIS machine and streams them to the demo VM over SSH, so the small VM never compiles
# anything and no registry is needed. Run from the repo root on a machine with Docker:
#   deploy/azure-demo/ship.sh lodestar@<fqdn>
# then on the VM: deploy/azure-demo/up.sh   (it uses the loaded images and builds nothing)
set -euo pipefail
target=${1:?usage: ship.sh <user@fqdn>}
cd "$(dirname "$0")/../.."
# the production override changes no build, so the base file is enough (and needs no .env)
NEXT_PUBLIC_DESIGN_PREVIEW=off docker compose -f docker-compose.yml build   # production: no ?design=1 prototype
images=$(docker compose -f docker-compose.yml config --format json \
  | python3 -c 'import json,sys; print(" ".join("lodestar-"+k for k,v in json.load(sys.stdin)["services"].items() if v.get("build")))' 2>/dev/null \
  || docker compose -f docker-compose.yml config --format json \
  | python -c 'import json,sys; print(" ".join("lodestar-"+k for k,v in json.load(sys.stdin)["services"].items() if v.get("build")))')
echo "shipping: $images"
# shared layers are sent once; gzip -1 keeps this machine's CPU, not the upload, as the limit
docker save $images | gzip -1 | ssh "$target" 'gunzip | docker load'
