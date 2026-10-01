variable "name" {
  type = string
}

variable "environment" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "oidc_issuer_url" {
  type = string
}

variable "acr_id" {
  type = string
}

variable "workloads" {
  description = "Workload identities keyed by name."
  type = map(object({
    namespace            = string
    service_account      = string
    api_roles            = optional(list(string), [])
    key_vault_secret_ids = optional(list(string), [])
    acr_pull             = optional(bool, false)
  }))
}

variable "role_group_object_ids" {
  description = "App role => Entra group object ID (store_manager, dispatcher, loader, driver, admin)."
  type        = map(string)
  default     = {}

  validation {
    condition     = alltrue([for k in keys(var.role_group_object_ids) : contains(["store_manager", "dispatcher", "loader", "driver", "admin"], k)])
    error_message = "Keys must be human app roles."
  }
}

variable "web_redirect_uris" {
  type = list(string)
}

variable "field_redirect_uris" {
  description = "Native redirect URIs for the Expo app, e.g. lodestar://auth."
  type        = list(string)
  default     = ["lodestar://auth"]
}

variable "field_spa_redirect_uris" {
  type = list(string)
}

variable "app_owner_object_ids" {
  type    = list(string)
  default = []
}

variable "ci_principal_object_id" {
  description = "Jenkins service principal object ID (AcrPush)."
  type        = string
  default     = null
}

variable "tags" {
  type    = map(string)
  default = {}
}
