output "id" {
  description = "Vault ID, available only after deployer RBAC has propagated."
  value       = time_sleep.rbac.triggers["id"]
}

output "name" {
  value = azurerm_key_vault.this.name
}

output "uri" {
  value = azurerm_key_vault.this.vault_uri
}

output "ingress_certificate_secret_id" {
  description = "ARM ID of the certificate's backing secret (for per-secret RBAC)."
  value       = "${azurerm_key_vault.this.id}/secrets/${azurerm_key_vault_certificate.ingress.name}"
}

output "ingress_certificate_name" {
  value = azurerm_key_vault_certificate.ingress.name
}

output "raw_id" {
  description = "Vault ID without the RBAC-propagation dependency (for diagnostics)."
  value       = azurerm_key_vault.this.id
}
