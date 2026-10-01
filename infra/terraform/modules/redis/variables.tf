variable "name" {
  description = "Globally unique cache name (becomes <name>.redis.cache.windows.net)."
  type        = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "sku_name" {
  description = "Standard (replicated, SLA) for dev; Premium (zone redundant) for prod. Basic has no SLA."
  type        = string
  default     = "Standard"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.sku_name)
    error_message = "The sku_name must be Basic, Standard or Premium."
  }
}

variable "capacity" {
  description = "Size within the family: C0-C6 (Basic/Standard) or P1-P5 (Premium)."
  type        = number
  default     = 1
}

variable "zones" {
  description = "Availability zones (Premium only; ignored otherwise)."
  type        = list(string)
  default     = []
}

variable "replicas_per_primary" {
  description = "Premium only: replicas per primary (spread over the zones)."
  type        = number
  default     = 1
}

variable "private_endpoint_subnet_id" {
  type = string
}

variable "private_dns_zone_id" {
  description = "privatelink.redis.cache.windows.net zone ID."
  type        = string
}

variable "key_vault_id" {
  description = "Vault for the redis-url secret (notifications reads it through the CSI driver)."
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
