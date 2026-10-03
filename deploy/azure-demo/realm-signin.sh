#!/usr/bin/env bash
# Switches a RUNNING lodestar realm to the designed sign-in screens (the VM's realm was imported long ago and is
# never re-imported). Idempotent: run it as often as you like.
#
#   deploy/azure-demo/realm-signin.sh            # on the VM, from the repo root, after up.sh (identity running)
#   IDENTITY_CONTAINER=lodestar-identity-1 deploy/azure-demo/realm-signin.sh
#
# What it does, through kcadm.sh inside the identity container (needs the image with the Lodestar extension,
# backend/identity/Dockerfile):
#   1. flow "lodestar direct grant" with the single execution lodestar-direct-grant (REQUIRED);
#   2. the public clients lodestar-web and lodestar-field: direct access grants on, direct-grant flow bound to it
#      (confidential service clients are not touched: no service can sign in as a user);
#   3. user attributes: `phone` (store manager, dispatcher, loader, driver from backend/prisma/scenario.ts; the
#      admin's from LODESTAR_ADMIN_PHONE) and the loader's `staff_id` (KDY-0427, LD-06);
#   4. a Dock PIN (LODESTAR_DEMO_PIN, default 2468) for every loader who has none (RESET_PINS=1: for all).
# Keycloak's own startup (the extension) does 1 and 2 as well; this script makes it explicit and adds 3 and 4.
# Admin credentials come from the environment or .env (KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD); nothing secret is
# printed.
set -eu   # no pipefail: `grep -q` may close a pipe early on purpose
cd "$(dirname "$0")/../.."
export MSYS_NO_PATHCONV=1   # Git Bash: keep container paths as they are

envval() { [ -f .env ] && grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" || true; }
ADMIN_USER=${KEYCLOAK_ADMIN:-$(envval KEYCLOAK_ADMIN)}; ADMIN_USER=${ADMIN_USER:-admin}
ADMIN_PASS=${KEYCLOAK_ADMIN_PASSWORD:-$(envval KEYCLOAK_ADMIN_PASSWORD)}; ADMIN_PASS=${ADMIN_PASS:-admin-dev-only}
PIN=${LODESTAR_DEMO_PIN:-$(envval LODESTAR_DEMO_PIN)}; PIN=${PIN:-2468}
ADMIN_PHONE=${LODESTAR_ADMIN_PHONE:-$(envval LODESTAR_ADMIN_PHONE)}; ADMIN_PHONE=${ADMIN_PHONE:-+94770000001}
REALM=${REALM:-lodestar}
FLOW="lodestar direct grant"
FLOW_PATH="lodestar%20direct%20grant"

C=${IDENTITY_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -m1 -E '(^|[-_])identity([-_][0-9]+)?$' || true)}
[ -n "$C" ] || { echo "identity container not found (set IDENTITY_CONTAINER)"; exit 1; }
echo "identity container: $C, realm: $REALM"

KC=(docker exec "$C" /opt/keycloak/bin/kcadm.sh)
kc() { "${KC[@]}" "$@" --config /tmp/kcadm-signin.config; }

# Signs kcadm in again (the master realm's admin token lives 60 s; a slow host needs a fresh one per step).
login() {
  docker exec -e KCPW="$ADMIN_PASS" "$C" bash -c \
    '/opt/keycloak/bin/kcadm.sh config credentials --config /tmp/kcadm-signin.config --server http://localhost:8080/auth --realm master --user "$0" --password "$KCPW" >/dev/null 2>&1' "$ADMIN_USER"
}
login

# 0. the extension must be in the image
kc get authentication/authenticator-providers -r "$REALM" | grep -q '"lodestar-direct-grant"' \
  || { echo "the identity image has no Lodestar sign-in extension: rebuild/pull lodestar-identity first"; exit 1; }

# 1. the flow
flow_id() { kc get authentication/flows -r "$REALM" --fields id,alias | tr -d '\r' | grep -B1 "\"alias\" : \"$FLOW\"" | grep -oE '[0-9a-f-]{36}' | head -1; }
FLOW_ID=$(flow_id || true)
if [ -z "$FLOW_ID" ]; then
  kc create authentication/flows -r "$REALM" -s alias="$FLOW" -s providerId=basic-flow -s topLevel=true -s builtIn=false \
    -s description="Lodestar sign-in screens: phone + SMS code, staff ID + PIN, email + password + 2-step" >/dev/null
  FLOW_ID=$(flow_id)
  echo "created flow '$FLOW'"
fi
execs=$(kc get "authentication/flows/$FLOW_PATH/executions" -r "$REALM")
if ! grep -q '"providerId" : "lodestar-direct-grant"' <<<"$execs"; then
  kc create "authentication/flows/$FLOW_PATH/executions/execution" -r "$REALM" -s provider=lodestar-direct-grant >/dev/null
  echo "added the lodestar-direct-grant execution"
fi
EXEC_ID=$(kc get "authentication/flows/$FLOW_PATH/executions" -r "$REALM" | tr -d '\r' | grep -B12 -A12 '"providerId" : "lodestar-direct-grant"' | grep -m1 -oE '"id" : "[0-9a-f-]{36}"' | grep -oE '[0-9a-f-]{36}')
kc update "authentication/flows/$FLOW_PATH/executions" -r "$REALM" -b "{\"id\":\"$EXEC_ID\",\"requirement\":\"REQUIRED\"}" >/dev/null
echo "flow '$FLOW' ($FLOW_ID): lodestar-direct-grant REQUIRED"

# 2. bind it to the public clients
for client in lodestar-web lodestar-field; do
  login
  id=$(kc get clients -r "$REALM" -q clientId="$client" --fields id --format csv --noquotes | tr -d '\r' | head -1)
  [ -n "$id" ] || { echo "client $client not found, skipped"; continue; }
  kc update "clients/$id" -r "$REALM" -s directAccessGrantsEnabled=true -s "authenticationFlowBindingOverrides.direct_grant=$FLOW_ID" >/dev/null
  echo "client $client: direct grants on, bound to '$FLOW'"
done

# 3. phone numbers and the loader's staff ID
user_id() { kc get users -r "$REALM" -q username="$1" -q exact=true --fields id --format csv --noquotes | tr -d '\r' | head -1; }
set_attr() { # user attribute value
  login
  local id; id=$(user_id "$1")
  [ -n "$id" ] || { echo "user $1 not found, skipped"; return; }
  kc update "users/$id" -r "$REALM" -s "attributes.$2=[\"$3\"]" >/dev/null
  echo "user $1: $2 set"
}
set_attr fathima phone +94774567890
set_attr nilanthi phone +94771234567
set_attr kasun phone +94772345678
set_attr ruwan phone +94773456789
set_attr admin phone "$ADMIN_PHONE"
set_attr kasun staff_id KDY-0427

# 4. Dock PINs for the loaders
login
loaders=$(kc get roles/loader/users -r "$REALM" --fields id --format csv --noquotes | tr -d '\r' || true)
for id in $loaders; do
  login
  creds=$(kc get "users/$id/credentials" -r "$REALM")
  if [ "${RESET_PINS:-0}" != 1 ] && grep -q '"type" : "lodestar-pin"' <<<"$creds"; then
    echo "loader $id: has a Dock PIN"
    continue
  fi
  kc create "lodestar-pin/$id" -r "$REALM" -b "{\"pin\":\"$PIN\"}" >/dev/null
  echo "loader $id: Dock PIN set"
done
echo "done: every role signs in on its own screen (no Keycloak page)"
