# Declared for later: the agent runs a MockChatModel today (AGENT_MODEL=mock).
# The platform module instantiates this with count = enable_openai ? 1 : 0.
resource "azurerm_cognitive_account" "this" {
  name                          = "oai-${var.name}"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  kind                          = "OpenAI"
  sku_name                      = "S0"
  custom_subdomain_name         = "oai-${var.name}"
  public_network_access_enabled = false
  local_auth_enabled            = false # Entra (workload identity) only, no API keys

  network_acls {
    default_action = "Deny"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

resource "azurerm_cognitive_deployment" "chat" {
  name                 = var.deployment_name
  cognitive_account_id = azurerm_cognitive_account.this.id

  model {
    format  = "OpenAI"
    name    = var.model_name
    version = var.model_version
  }

  sku {
    name     = "Standard"
    capacity = var.capacity
  }
}

resource "azurerm_private_endpoint" "this" {
  name                          = "pe-oai-${var.name}"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  subnet_id                     = var.private_endpoint_subnet_id
  custom_network_interface_name = "nic-pe-oai-${var.name}"

  private_service_connection {
    name                           = "psc-oai-${var.name}"
    private_connection_resource_id = azurerm_cognitive_account.this.id
    subresource_names              = ["account"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "openai"
    private_dns_zone_ids = [var.private_dns_zone_id]
  }

  tags = var.tags
}

# Only the agent's workload identity may call the model.
resource "azurerm_role_assignment" "agent" {
  scope                            = azurerm_cognitive_account.this.id
  role_definition_name             = "Cognitive Services OpenAI User"
  principal_id                     = var.agent_principal_id
  skip_service_principal_aad_check = true
}
