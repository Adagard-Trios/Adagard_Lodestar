variable "environment" {
  type = string
}

variable "namespace" {
  type    = string
  default = "argocd"
}

variable "argocd_chart_version" {
  type    = string
  default = "7.8.13"
}

variable "argocd_apps_chart_version" {
  type    = string
  default = "2.0.2"
}

variable "argocd_hostname" {
  type    = string
  default = "argocd.local"
}

variable "git_repo_url" {
  type = string
}

variable "git_target_revision" {
  type    = string
  default = "main"
}

variable "git_repo_username" {
  type    = string
  default = "git"
}

variable "git_repo_password" {
  description = "Read-only token for a private repo. null for a public repo."
  type        = string
  default     = null
  sensitive   = true
}

variable "admin_group_object_ids" {
  description = "Entra groups mapped to Argo CD role:admin (when SSO is configured)."
  type        = list(string)
  default     = []
}

variable "admin_enabled" {
  description = "Local admin user; disable once SSO is wired."
  type        = bool
  default     = true
}

variable "notifications_enabled" {
  type    = bool
  default = false
}
