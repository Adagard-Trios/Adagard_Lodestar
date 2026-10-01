variable "name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "delegated_subnet_id" {
  type = string
}

variable "private_dns_zone_id" {
  type = string
}

variable "key_vault_id" {
  type = string
}

variable "database_name" {
  type    = string
  default = "lodestar"
}

variable "service_schemas" {
  description = "One schema + login role per service."
  type        = list(string)
}

variable "sku_name" {
  type    = string
  default = "B_Standard_B2s"
}

variable "storage_mb" {
  type    = number
  default = 32768
}

variable "storage_tier" {
  type    = string
  default = "P4"
}

variable "backup_retention_days" {
  type    = number
  default = 7
}

variable "geo_redundant_backup_enabled" {
  type    = bool
  default = false
}

variable "high_availability" {
  description = "Zone-redundant HA (General Purpose / Memory Optimized SKUs only)."
  type        = bool
  default     = false
}

variable "entra_admin_group_object_id" {
  type    = string
  default = null
}

variable "entra_admin_group_name" {
  type    = string
  default = "lodestar-db-admins"
}

variable "tags" {
  type    = map(string)
  default = {}
}
