output "api_client_id" {
  value = azuread_application.api.client_id
}

output "api_identifier_uri" {
  value = azuread_application_identifier_uri.api.identifier_uri
}

output "web_client_id" {
  value = azuread_application.web.client_id
}

output "field_client_id" {
  value = azuread_application.field.client_id
}

output "workload_client_ids" {
  value = { for k, v in azurerm_user_assigned_identity.workload : k => v.client_id }
}

output "workload_principal_ids" {
  value = { for k, v in azurerm_user_assigned_identity.workload : k => v.principal_id }
}

output "tenant_id" {
  value = data.azuread_client_config.current.tenant_id
}
