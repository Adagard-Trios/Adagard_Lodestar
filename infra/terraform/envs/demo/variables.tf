variable "subscription_id" {
  description = "Azure subscription to deploy into (az account show --query id -o tsv)."
  type        = string
}

variable "location" {
  description = "Azure region, e.g. southeastasia or centralindia."
  type        = string
}

variable "name" {
  description = "Prefix for every resource name."
  type        = string
  default     = "lodestar-demo"
}

variable "dns_label" {
  description = "Public DNS label: the site becomes https://<dns_label>.<location>.cloudapp.azure.com"
  type        = string
}

variable "ssh_source_cidr" {
  description = "The only address range allowed to SSH (port 22), e.g. 203.0.113.7/32."
  type        = string
}

variable "vm_size" {
  description = "VM size. The compose stack idles at about 1.5 GB, so 2 vCPU / 4 GiB (plus 4 GiB swap) is enough; use Standard_B2ms (8 GiB) with install_k3s."
  type        = string
  default     = "Standard_B2als_v2"
}

variable "os_disk_size_gb" {
  description = "OS disk size. 32 GB holds the pulled images; 64 GB if the VM builds them itself."
  type        = number
  default     = 32
}

variable "install_k3s" {
  description = "Also install k3s for the GitOps path (deploy/argocd). Off by default: it costs about 500 MB of RAM the compose stack can use."
  type        = bool
  default     = false
}

variable "admin_username" {
  type    = string
  default = "lodestar"
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key for the VM admin user."
  type        = string
}

variable "budget_amount" {
  description = "Monthly budget for the resource group, in the billing currency (USD)."
  type        = number
  default     = 100
}

variable "budget_alert_emails" {
  description = "Who gets the budget alerts."
  type        = list(string)
}

variable "budget_start_date" {
  description = "First day of the budget period, YYYY-MM-01 (Azure requires the first of a month)."
  type        = string
  default     = "2026-10-01"
}

variable "tags" {
  type = map(string)
  default = {
    project     = "waypoint-lodestar"
    team        = "adagard"
    environment = "demo"
    event       = "tech-triathlon-2026"
    managed-by  = "terraform"
  }
}
