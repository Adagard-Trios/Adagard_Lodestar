output "id" {
  value = azurerm_postgresql_flexible_server.this.id
}

output "fqdn" {
  value = azurerm_postgresql_flexible_server.this.fqdn
}

output "database_name" {
  value = azurerm_postgresql_flexible_server_database.lodestar.name
}

output "service_url_secret_ids" {
  description = "schema => ARM ID of its database-url secret (for per-secret RBAC)."
  value       = { for k, s in azurerm_key_vault_secret.service_url : k => "${var.key_vault_id}/secrets/${s.name}" }
}

output "service_password_secret_ids" {
  value = { for k, s in azurerm_key_vault_secret.service_password : k => "${var.key_vault_id}/secrets/${s.name}" }
}

output "admin_url_secret_id" {
  value = "${var.key_vault_id}/secrets/${azurerm_key_vault_secret.admin_url.name}"
}
