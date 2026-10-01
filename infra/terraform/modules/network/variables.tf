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

variable "zones" {
  type    = list(string)
  default = ["1", "2", "3"]
}

variable "address_space" {
  description = "VNet CIDR. Must not overlap the AKS pod/service CIDRs."
  type        = string
  default     = "10.40.0.0/16"
}

variable "subnets" {
  description = "Subnet CIDRs by role."
  type = object({
    aks_system        = string
    aks_user          = string
    postgres          = string
    private_endpoints = string
    private_link      = string
    appgw             = string
  })
  default = {
    aks_system        = "10.40.0.0/22"
    aks_user          = "10.40.4.0/22"
    postgres          = "10.40.8.0/24"
    private_endpoints = "10.40.9.0/24"
    private_link      = "10.40.10.0/24"
    appgw             = "10.40.11.0/24"
  }
}

variable "extra_private_dns_zones" {
  description = "Additional privatelink zones, e.g. privatelink.openai.azure.com."
  type        = list(string)
  default     = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
