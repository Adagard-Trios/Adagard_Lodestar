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
  description = "privatelink.azurecr.io zone."
  type        = string
}

variable "kubelet_object_id" {
  type = string
}

variable "allowed_ip_ranges" {
  description = "Public CIDRs allowed to push (Jenkins). Empty = private endpoint only."
  type        = list(string)
  default     = []
}

variable "zone_redundancy_enabled" {
  type    = bool
  default = false
}

variable "untagged_retention_days" {
  type    = number
  default = 7
}

variable "tags" {
  type    = map(string)
  default = {}
}
