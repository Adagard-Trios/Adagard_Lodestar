output "id" {
  value = azurerm_redis_cache.this.id
}

output "hostname" {
  value = azurerm_redis_cache.this.hostname
}

output "ssl_port" {
  value = azurerm_redis_cache.this.ssl_port
}

output "url_secret_id" {
  description = "ARM ID of the redis-url Key Vault secret (for per-secret RBAC)."
  value       = "${var.key_vault_id}/secrets/${azurerm_key_vault_secret.redis_url.name}"
}
