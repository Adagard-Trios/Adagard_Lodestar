variable "name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "kubernetes_version" {
  description = "null = AKS default."
  type        = string
  default     = null
}

variable "sku_tier" {
  description = "Free for dev, Standard (uptime SLA) for prod."
  type        = string
  default     = "Free"
}

variable "private_cluster_enabled" {
  description = "Private API server. Terraform/Jenkins must then run inside the VNet (or peer)."
  type        = bool
  default     = false
}

variable "api_server_authorized_ip_ranges" {
  description = "CIDRs allowed to reach a public API server (Jenkins egress, admins)."
  type        = list(string)
  default     = []
}

variable "admin_group_object_ids" {
  description = "Entra groups that get cluster admin via Azure RBAC."
  type        = list(string)
  default     = []
}

variable "system_subnet_id" {
  type = string
}

variable "user_subnet_id" {
  type = string
}

variable "private_link_subnet_id" {
  description = "Subnet for the Private Link Service NAT IPs (AKS creates the PLS)."
  type        = string
}

variable "pod_cidr" {
  type    = string
  default = "192.168.0.0/16"
}

variable "service_cidr" {
  type    = string
  default = "172.16.0.0/16"
}

variable "dns_service_ip" {
  type    = string
  default = "172.16.0.10"
}

variable "istio_revision" {
  description = "AKS Istio add-on revision, e.g. asm-1-26. Namespaces opt in with istio.io/rev=<revision>."
  type        = string
}

variable "log_analytics_workspace_id" {
  type = string
}

variable "zones" {
  type    = list(string)
  default = ["1", "2", "3"]
}

variable "host_encryption_enabled" {
  description = "Requires the EncryptionAtHost feature on the subscription."
  type        = bool
  default     = false
}

variable "system_node_vm_size" {
  type    = string
  default = "Standard_D4ds_v5"
}

variable "system_node_min" {
  type    = number
  default = 1
}

variable "system_node_max" {
  type    = number
  default = 3
}

variable "user_node_vm_size" {
  type    = string
  default = "Standard_D4ds_v5"
}

variable "user_node_min" {
  type    = number
  default = 1
}

variable "user_node_max" {
  type    = number
  default = 5
}

variable "tags" {
  type    = map(string)
  default = {}
}
