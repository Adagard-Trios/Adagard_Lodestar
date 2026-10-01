output "resource_group_name" {
  value = azurerm_resource_group.state.name
}

output "storage_account_name" {
  value = azurerm_storage_account.state.name
}

output "containers" {
  value = { for k, c in azurerm_storage_container.state : k => c.name }
}

output "backend_hcl" {
  description = "Paste into envs/<env>/backend.hcl."
  value = { for env in var.environments : env => <<-EOT
    resource_group_name  = "${azurerm_resource_group.state.name}"
    storage_account_name = "${azurerm_storage_account.state.name}"
    container_name       = "tfstate-${env}"
    key                  = "lodestar-${env}.tfstate"
    use_azuread_auth     = true
  EOT
  }
}
