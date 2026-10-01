output "profile_id" {
  value = azurerm_cdn_frontdoor_profile.this.id
}

output "waf_policy_id" {
  value = azurerm_cdn_frontdoor_firewall_policy.this.id
}

output "endpoint_hostnames" {
  value = { for k, e in azurerm_cdn_frontdoor_endpoint.site : k => e.host_name }
}

output "frontdoor_id" {
  description = "X-Azure-FDID value; the Istio ingress can require it."
  value       = azurerm_cdn_frontdoor_profile.this.resource_guid
}
