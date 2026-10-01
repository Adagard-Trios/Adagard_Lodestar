resource "azurerm_container_registry" "this" {
  name                          = var.name # globally unique, alphanumeric only
  resource_group_name           = var.resource_group_name
  location                      = var.location
  sku                           = "Premium"
  admin_enabled                 = false
  anonymous_pull_enabled        = false
  data_endpoint_enabled         = true
  zone_redundancy_enabled       = var.zone_redundancy_enabled
  public_network_access_enabled = length(var.allowed_ip_ranges) > 0
  network_rule_bypass_option    = "AzureServices"
  retention_policy_in_days      = var.untagged_retention_days
  quarantine_policy_enabled     = false

  # Jenkins pushes from its egress IPs; everything else uses the private endpoint.
  network_rule_set {
    default_action = "Deny"

    # attribute-as-block in the provider schema, hence a list expression
    ip_rule = [for cidr in var.allowed_ip_ranges : {
      action   = "Allow"
      ip_range = cidr
    }]
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "this" {
  name                          = "pe-${var.name}"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  subnet_id                     = var.private_endpoint_subnet_id
  custom_network_interface_name = "nic-pe-${var.name}"

  private_service_connection {
    name                           = "psc-${var.name}"
    private_connection_resource_id = azurerm_container_registry.this.id
    subresource_names              = ["registry"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "acr"
    private_dns_zone_ids = [var.private_dns_zone_id]
  }

  tags = var.tags
}

# Nodes pull images with the kubelet identity; no pull secrets anywhere.
resource "azurerm_role_assignment" "kubelet_pull" {
  scope                            = azurerm_container_registry.this.id
  role_definition_name             = "AcrPull"
  principal_id                     = var.kubelet_object_id
  skip_service_principal_aad_check = true
}
