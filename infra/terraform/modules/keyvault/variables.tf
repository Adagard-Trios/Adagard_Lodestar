variable "name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "private_endpoint_subnet_id" {
  type = string
}

variable "private_dns_zone_id" {
  description = "privatelink.vaultcore.azure.net zone."
  type        = string
}

variable "allowed_ip_ranges" {
  description = "Public CIDRs for the deployer (Jenkins). Empty = private endpoint only (run Terraform inside the VNet)."
  type        = list(string)
  default     = []
}

variable "admin_group_object_ids" {
  type    = list(string)
  default = []
}

variable "ingress_hostnames" {
  description = "Hostnames served by the Istio ingress (web first)."
  type        = list(string)
}

variable "tags" {
  type    = map(string)
  default = {}
}
