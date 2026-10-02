#!/usr/bin/env bash
# Installs the automatic deploys on the demo VM (once, from the repo root): a systemd timer that runs
# deploy/azure-demo/autodeploy.sh every 3 minutes as the current user.
#   deploy/azure-demo/install-autodeploy.sh
#   systemctl list-timers lodestar-autodeploy.timer        journalctl -u lodestar-autodeploy -f
set -euo pipefail
cd "$(dirname "$0")/../.."
dir=$(pwd)
user=$(id -un)

sudo tee /etc/systemd/system/lodestar-autodeploy.service >/dev/null <<EOF
[Unit]
Description=Lodestar demo: deploy the newest successful deploy-demo run from main
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=$user
WorkingDirectory=$dir
ExecStart=$dir/deploy/azure-demo/autodeploy.sh
TimeoutStartSec=2400
EOF

sudo tee /etc/systemd/system/lodestar-autodeploy.timer >/dev/null <<EOF
[Unit]
Description=Lodestar demo: check for a new deploy every 3 minutes

[Timer]
OnBootSec=2min
OnUnitInactiveSec=3min

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now lodestar-autodeploy.timer
systemctl list-timers lodestar-autodeploy.timer --no-pager
