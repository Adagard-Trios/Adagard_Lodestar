# The public demo on one Azure VM

One Ubuntu VM runs the same `docker compose` stack as a laptop. Caddy sits in front of it on ports 80 and 443 with a Let's Encrypt certificate for the VM's Azure DNS name (`<label>.<region>.cloudapp.azure.com`). Terraform is in [`infra/terraform/envs/demo`](../../infra/terraform/envs/demo).

| Resource | Size |
|---|---|
| Resource group, VNet, subnet, NSG | 80 and 443 open; 22 only from your address range |
| Static public IP with a DNS label | Standard SKU |
| VM | `Standard_B2ms` (2 vCPU, 8 GiB), Ubuntu 24.04, 64 GB Standard SSD, 4 GiB swap |
| Budget on the resource group | $100 a month, e-mail alerts at $50 and $80 |

Not used, on purpose: managed Postgres/Redis, Front Door, a container registry, Log Analytics, spot VMs, auto-shutdown.

## Cost

Approximate pay-as-you-go list prices (check them in the Azure pricing calculator for your region; they vary by region):

| Item | Per month |
|---|---|
| `Standard_B2ms` Linux VM, running all the time | ~$61–70 |
| 64 GB Standard SSD (E6) | ~$5 |
| Static Standard public IP | ~$4 |
| Outbound data (judges browsing) | < $1 |
| **Total** | **~$70–80** |

$100 of credit therefore keeps the demo up for about five to six weeks. The budget alerts arrive at $50 and $80; to stop the cost, `terraform destroy` (everything is in one resource group).

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

`terraform.tfvars` and the state stay on your machine (gitignored). cloud-init installs Docker, a 4 GiB swap file and k3s (without Traefik or its load balancer, so nothing in k3s takes 80/443). Give it about 5 minutes after `apply`, then check with `ssh lodestar@<fqdn> 'docker version && sudo k3s kubectl get nodes'`.

## 2. Start the stack on the VM

```bash
ssh lodestar@<fqdn>
cd /opt/lodestar
git clone https://github.com/<owner>/<repo>.git .
# the personas' passwords are published in the README for the judges: choose them here
LODESTAR_DEMO_PASSWORD='<persona password>' LODESTAR_ADMIN_PASSWORD='<admin password>' \
  deploy/azure-demo/make-env.sh <fqdn> <you@example.com>
# optional: the competition CSVs, copied by hand (never committed, never in an image)
#   scp data/*.csv lodestar@<fqdn>:/opt/lodestar/data/
deploy/azure-demo/up.sh
```

`make-env.sh` writes `.env` with random secrets for Postgres, Redis, Keycloak and every service client. `up.sh` refuses to start if any value is missing or still a dev default. It builds the images on the VM, starts the stack with [`compose.prod.yml`](compose.prod.yml), and waits until the start page, the API and Keycloak answer.

The production override:
- adds Caddy on 80/443 (Let's Encrypt, HTTP/3)
- publishes nothing else (no 8443, 8080, 8180, 9000)
- runs Keycloak in production mode behind the proxy

## 3. Check it from a phone-sized browser

Open `https://<fqdn>/`, pick each role on the start page and sign in with the README accounts. Driver and loader open the field app at `/field/`.

## Updating

```bash
ssh lodestar@<fqdn> 'cd /opt/lodestar && git pull && deploy/azure-demo/up.sh'
```

The demo day is created once per date (`DEMO_DATE` in `.env`, empty = today in Sri Lanka). To start the day again from scratch: `deploy/azure-demo/up.sh down && docker volume rm lodestar_pgdata && deploy/azure-demo/up.sh`.

## Who owns 80/443

Either compose (Caddy) or k3s owns ports 80 and 443, never both:
- **Compose → k3s:** `deploy/azure-demo/up.sh down`, then enable the k3s ingress (WP8b, `deploy/k8s/overlays/demo`).
- **k3s → compose:** remove the k3s ingress, then `deploy/azure-demo/up.sh`.

The GitOps path is described in [`deploy/argocd/README.md`](../argocd/README.md).
