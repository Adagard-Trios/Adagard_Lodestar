variable "subscription_id" {
  description = "Target subscription. Leave null to use ARM_SUBSCRIPTION_ID."
  type        = string
  default     = null
}

variable "project" {
  description = "Short project name used in resource names."
  type        = string
  default     = "lodestar"
}

variable "location" {
  description = "Azure region for the state storage."
  type        = string
  default     = "southeastasia"
}

variable "unique_suffix" {
  description = "3-6 lowercase alphanumerics that make globally unique names (storage, ACR, Key Vault) unique."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{3,6}$", var.unique_suffix))
    error_message = "unique_suffix must be 3-6 lowercase letters or digits."
  }
}

variable "environments" {
  description = "One blob container of state per environment."
  type        = list(string)
  default     = ["dev", "prod"]
}

variable "state_contributor_object_ids" {
  description = "Object IDs (Jenkins service principal, platform admins group) granted Storage Blob Data Contributor on the state account."
  type        = list(string)
  default     = []
}

variable "allowed_ip_ranges" {
  description = "Public CIDRs (Jenkins egress, admin workstations) allowed to reach the state account. Empty = only Azure services."
  type        = list(string)
  default     = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
