output "public_url" {
  description = "PUBLIC_ORIGIN for the VM's .env"
  value       = "https://${azurerm_public_ip.vm.fqdn}"
}

output "fqdn" {
  value = azurerm_public_ip.vm.fqdn
}

output "public_ip" {
  value = azurerm_public_ip.vm.ip_address
}

output "ssh" {
  value = "ssh ${var.admin_username}@${azurerm_public_ip.vm.fqdn}"
}
