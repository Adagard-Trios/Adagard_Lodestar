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
  description = "privatelink.openai.azure.com zone."
  type        = string
}

variable "agent_principal_id" {
  type = string
}

variable "deployment_name" {
  type    = string
  default = "planner"
}

variable "model_name" {
  type    = string
  default = "gpt-4o-mini"
}

variable "model_version" {
  type    = string
  default = "2024-07-18"
}

variable "capacity" {
  description = "Thousands of tokens per minute."
  type        = number
  default     = 10
}

variable "tags" {
  type    = map(string)
  default = {}
}
