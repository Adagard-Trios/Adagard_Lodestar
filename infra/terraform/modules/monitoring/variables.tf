variable "name" {
  description = "Base name, e.g. lodestar-dev-sea."
  type        = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "retention_in_days" {
  type    = number
  default = 30
}

variable "daily_quota_gb" {
  description = "-1 for unlimited."
  type        = number
  default     = -1
}

variable "diagnostic_targets" {
  description = "Resources that send logs/metrics to the workspace. Keys must be static strings."
  type = map(object({
    resource_id = string
    log_groups  = optional(list(string), ["allLogs"])
    logs        = optional(list(string), [])
    metrics     = optional(bool, true)
  }))
  default = {}
}

variable "tags" {
  type    = map(string)
  default = {}
}
