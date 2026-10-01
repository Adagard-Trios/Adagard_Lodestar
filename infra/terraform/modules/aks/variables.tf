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
  description = "Minimum nodes per user pool (per zone when user_pool_per_zone)."
  type        = number
  default     = 1
}

variable "user_node_max" {
  description = "Maximum nodes per user pool (per zone when user_pool_per_zone)."
  type        = number
  default     = 5
}

variable "user_pool_per_zone" {
  description = "One user pool per zone (zone-aware cluster autoscaling for hard zone spread). false = one pool across all zones."
  type        = bool
  default     = true
}

variable "keda_enabled" {
  description = "AKS KEDA add-on (workload_autoscaler_profile)."
  type        = bool
  default     = true
}

variable "vpa_enabled" {
  description = "AKS Vertical Pod Autoscaler add-on. Off: the HPAs scale on CPU/memory, and VPA in Auto mode would fight them."
  type        = bool
  default     = false
}

variable "autoscaler_profile" {
  description = "Cluster autoscaler tuning that differs per environment."
  type = object({
    expander                         = optional(string, "least-waste")
    scan_interval                    = optional(string, "10s")
    scale_down_delay_after_add       = optional(string, "10m")
    scale_down_unneeded              = optional(string, "10m")
    scale_down_utilization_threshold = optional(string, "0.5")
  })
  default = {}

  validation {
    condition     = contains(["least-waste", "most-pods", "priority", "random"], var.autoscaler_profile.expander)
    error_message = "The expander must be least-waste, most-pods, priority or random."
  }
}

variable "agent_spot_pool" {
  description = "Optional Azure spot pool for the planning agent (tainted, min 0). max_price -1 = up to the on-demand price (evicted for capacity only)."
  type = object({
    enabled   = optional(bool, false)
    vm_size   = optional(string, "Standard_D4ds_v5")
    max_count = optional(number, 3)
    max_price = optional(number, -1)
  })
  default = {}
}

variable "tags" {
  type    = map(string)
  default = {}
}
