variable "name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  description = "Region of the Private Link Service."
  type        = string
}

variable "web_hostname" {
  description = "Host of the desk UI + API (Istio VirtualService host)."
  type        = string
}

variable "field_hostname" {
  description = "Host of mobile-web (Expo web build)."
  type        = string
}

variable "custom_domains_enabled" {
  type    = bool
  default = false
}

variable "dns_zone_id" {
  description = "Azure DNS zone for managed-certificate validation (optional)."
  type        = string
  default     = null
}

variable "origin_enabled" {
  description = "Create origin groups/origins/routes. Enable after the ingress Private Link Service exists."
  type        = bool
  default     = false
}

variable "private_link_service_id" {
  type    = string
  default = null
}

variable "origin_private_ip" {
  description = "Frontend IP of the internal ingress load balancer (used as origin host_name)."
  type        = string
  default     = null
}

variable "waf_mode" {
  type    = string
  default = "Prevention"
}

variable "rate_limit_per_minute" {
  type    = number
  default = 1000
}

variable "write_rate_limit_per_minute" {
  type    = number
  default = 200
}

variable "geo_allow_countries" {
  description = "ISO country codes allowed (empty = no geo filter), e.g. [\"LK\"]."
  type        = list(string)
  default     = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
