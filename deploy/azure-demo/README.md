# The public demo on one Azure VM

One Ubuntu VM runs the same `docker compose` stack as a laptop. Caddy sits in front of it on ports 80 and 443 with a Let's Encrypt certificate for the VM's Azure DNS name (`<label>.<region>.cloudapp.azure.com`). Terraform is in [`infra/terraform/envs/demo`](../../infra/terraform/envs/demo).

| Resource | Size |
|---|---|
| Resource group, VNet, subnet, NSG | 80 and 443 open; 22 only from your address range |
| Static public IP with a DNS label | Standard SKU |
| VM | `Standard_B2als_v2` (2 vCPU, 4 GiB), Ubuntu 24.04, 32 GB Standard SSD, 4 GiB swap (`vm_size`, `os_disk_size_gb`) |
| Budgets on the resource group | **credit**: $100 for the year, alerts at 25/50/75/90% spent and when the forecast says the credit runs out; **monthly**: $45, alerts at 50% and 100% and when the month is forecast above $49.50 |

Not used, on purpose: managed Postgres/Redis, Front Door, an Azure container registry (CI pushes to GHCR), Log Analytics, spot VMs, auto-shutdown, and k3s (`install_k3s = true` adds it for the GitOps path; then use `Standard_B2ms`).

The whole stack idles at about 1.5 GB: Keycloak ~0.6–0.8 GB, Postgres ~0.2 GB, the frontend ~0.16 GB, each of the nine NestJS services ~50 MB. [`compose.prod.yml`](compose.prod.yml) puts a memory ceiling on every container, so a leak restarts that container instead of the VM.

## Cost

Approximate pay-as-you-go list prices (check them in the Azure pricing calculator for your region; they vary by region):

| Item | Per month |
|---|---|
| `Standard_B2als_v2` Linux VM, running all the time | ~$27–35 |
| 32 GB Standard SSD (E4) | ~$2.5 |
| Static Standard public IP | ~$4 |
| Outbound data (judges browsing) | < $1 |
| **Total** | **~$35–42** |

$100 of credit therefore keeps the demo up for about two and a half months. A monthly budget alone would never fire (each month costs less than the credit), so a second budget tracks the total against the $100. Cost data reaches Azure 8–24 hours late. Check it in the portal (Cost Management → Cost analysis, scope `lodestar-demo-rg`) and the remaining credit at https://www.microsoftazuresponsorships.com/Balance.

To pause the cost: `az vm deallocate -g lodestar-demo-rg -n lodestar-demo-vm` (only the disk and IP bill, ~$6/month; `az vm start` resumes, same URL). To stop it for good: `terraform destroy` (everything is in one resource group).

## 1. Create the VM (you run this; it needs your Azure login)

```bash
az login
az account show --query id -o tsv                     # the subscription id
cd infra/terraform/envs/demo
cp terraform.tfvars.example terraform.tfvars          # fill in: subscription_id, location, dns_label,
                                                      # ssh_source_cidr (your IP/32), ssh_public_key_path, budget_alert_emails
terraform init
terraform plan -out demo.tfplan
terraform apply demo.tfplan
terraform output                                      # public_url, fqdn, ssh
```

`terraform.tfvars` and the state stay on your machine (gitignored; the repo is public, so never commit them). cloud-init installs Docker (with rotated container logs), a 4 GiB swap file and a weekly image prune; with `install_k3s = true` also k3s (without Traefik or its load balancer, so nothing in k3s takes 80/443). Give it about 5 minutes after `apply`, then check with `ssh lodestar@<fqdn> 'docker version'`.

SSH is open only to `ssh_source_cidr`. If your public address changes, update it in `terraform.tfvars` and `terraform apply` again.

## 2. Start the stack on the VM

```bash
ssh lodestar@<fqdn>
cd /opt/lodestar
git clone https://github.com/Adagard-Trios/Lodestar.git .
# the personas' passwords are published in the README for the judges: choose them here
LODESTAR_DEMO_PASSWORD='<persona password>' LODESTAR_ADMIN_PASSWORD='<admin password>' \
  deploy/azure-demo/make-env.sh <fqdn> <you@example.com>
# optional: the competition CSVs, copied by hand (never committed, never in an image)
#   scp data/*.csv lodestar@<fqdn>:/opt/lodestar/data/
deploy/azure-demo/up.sh
```

`make-env.sh` writes `.env` with random secrets for Postgres, Redis, Keycloak and every service client. `up.sh` refuses to start if any value is missing or still a dev default. It starts the stack with [`compose.prod.yml`](compose.prod.yml) and waits until the start page, the API and Keycloak answer.

Where the images come from:
- **Pulled (preferred, nothing is compiled on the VM):** add `REGISTRY=ghcr.io/adagard-trios` and `TAG=<commit SHA>` to `.env`. CI (`.circleci/config.yml`, `images` job) pushes the 14 images with that tag on every `main` build. The GHCR packages must be public, or run `docker login ghcr.io` on the VM with a `read:packages` token.
- **Built on the VM (no registry):** leave `REGISTRY` empty. `up.sh` builds one image at a time, because parallel Next.js and Nest builds do not fit in 4 GiB; the first build takes a while, later ones reuse the layer cache. Use `os_disk_size_gb = 64` for the build cache.

The production override:
- adds Caddy on 80/443 (Let's Encrypt, HTTP/3)
- publishes nothing else (no 8443, 8080, 8180, 9000)
- runs Keycloak in production mode behind the proxy, with a local cache and a heap sized to its 1 GiB ceiling
- caps the memory of every container

## 3. Check it from a phone-sized browser

Open `https://<fqdn>/`, pick each role on the start page and sign in with the README accounts. Driver and loader open the field app at `/field/`.

## Updating

```bash
ssh lodestar@<fqdn> 'cd /opt/lodestar && git pull && deploy/azure-demo/up.sh'
```

In pull mode, set `TAG` in `.env` to the new commit SHA first.

The demo day is created once per date (`DEMO_DATE` in `.env`, empty = today in Sri Lanka). To start the day again from scratch: `deploy/azure-demo/up.sh down && docker volume rm lodestar_pgdata && deploy/azure-demo/up.sh`.

## Who owns 80/443: compose or k3s (GitOps, WP8b)

The public URL is served by this compose stack until the GitOps cut-over has been done; then it is served by k3s, synced by Argo CD from `deploy/k8s/overlays/demo`. Setup (cert-manager, Argo CD, ingress-nginx, the Secrets and CSV ConfigMap from this `.env` via [`k3s-secrets.sh`](k3s-secrets.sh)) is in [`deploy/argocd/README.md`](../argocd/README.md), "Demo on k3s".

The two cannot share the VM's resources or ports:
- **VM size.** k3s plus compose does not fit in the default `Standard_B2als_v2` (4 GiB). For the GitOps path use `vm_size = "Standard_B2ms"` (8 GiB) and `install_k3s = true`. On a VM that already runs this demo, change only `vm_size`; flipping `install_k3s` changes cloud-init, which makes Terraform replace the VM. Install k3s by hand instead (the command is in step 0 of the Argo CD README).
- **Ports.** Caddy (compose) and ingress-nginx (k3s, `hostNetwork`) both bind 80 and 443, and ingress-nginx binds them whenever k3s runs. So once ingress-nginx is installed, **k3s runs only while compose is down**, and the cut-over always starts by stopping compose. (Before that, during setup, k3s and compose can run side by side.)

**Compose → k3s** (after ingress-nginx has been installed once, step 7 of the Argo CD README):

```bash
cd /opt/lodestar
bash deploy/azure-demo/up.sh down            # Caddy and the stack stop; the volumes (pgdata, certificates) stay
sudo systemctl enable --now k3s              # ingress-nginx takes 80/443, Argo CD keeps the app in sync
curl -fsS https://<fqdn>/version; echo       # the commit Argo CD deployed
```

**k3s → compose:**

```bash
cd /opt/lodestar
sudo systemctl disable --now k3s && sudo /usr/local/bin/k3s-killall.sh   # every pod stops, 80/443 and the memory are free
bash deploy/azure-demo/up.sh
```

`disable` keeps k3s from starting again at the next reboot and racing Caddy for the ports. The two sides have separate databases; each seeds its own demo day. Both use the same `.env`, so the passwords are the same on either side.
