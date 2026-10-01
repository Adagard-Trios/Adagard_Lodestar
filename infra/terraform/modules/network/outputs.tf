output "vnet_id" {
  value = azurerm_virtual_network.this.id
}

output "subnet_ids" {
  value = {
    aks_system        = azurerm_subnet.aks_system.id
    aks_user          = azurerm_subnet.aks_user.id
    postgres          = azurerm_subnet.postgres.id
    private_endpoints = azurerm_subnet.private_endpoints.id
    private_link      = azurerm_subnet.private_link.id
    appgw             = azurerm_subnet.appgw.id
  }
}

output "subnet_cidrs" {
  value = var.subnets
}

output "private_link_subnet_name" {
  value = azurerm_subnet.private_link.name
}

output "private_dns_zone_ids" {
  description = "privatelink zone IDs keyed by zone name."
  value       = { for k, z in azurerm_private_dns_zone.pe : k => z.id }
}

output "postgres_private_dns_zone_id" {
  value = azurerm_private_dns_zone.postgres.id
}

output "nat_public_ip" {
  value = azurerm_public_ip.nat.ip_address
}

output "network_security_group_ids" {
  value = {
    aks               = azurerm_network_security_group.aks.id
    postgres          = azurerm_network_security_group.postgres.id
    private_endpoints = azurerm_network_security_group.private_endpoints.id
  }
}
