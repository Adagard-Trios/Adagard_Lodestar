data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "this" {
  name                          = var.name # 3-24 chars, globally unique
  resource_group_name           = var.resource_group_name
  location                      = var.location
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "premium"
  rbac_authorization_enabled    = true
  purge_protection_enabled      = true
  soft_delete_retention_days    = 90
  public_network_access_enabled = length(var.allowed_ip_ranges) > 0

  # Terraform (Jenkins) writes generated secrets from its egress IPs; pods and
  # the CSI driver read through the private endpoint.
  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
    ip_rules       = var.allowed_ip_ranges
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
    private_connection_resource_id = azurerm_key_vault.this.id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "kv"
    private_dns_zone_ids = [var.private_dns_zone_id]
  }

  tags = var.tags
}

# The deployer writes secrets (random_password values) and certificates.
resource "azurerm_role_assignment" "deployer_secrets" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_role_assignment" "deployer_certificates" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Certificates Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_role_assignment" "admins" {
  for_each             = toset(var.admin_group_object_ids)
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = each.value
}

# RBAC propagation delay before the first data-plane write.
resource "time_sleep" "rbac" {
  create_duration = "60s"
  triggers = {
    id = azurerm_key_vault.this.id
    a  = azurerm_role_assignment.deployer_secrets.id
    b  = azurerm_role_assignment.deployer_certificates.id
  }
}

# Origin TLS certificate for the Istio ingress gateway (Front Door -> origin is
# HTTPS). Terraform creates a self-signed placeholder so the secret exists and
# per-secret RBAC can be granted; import the real CA-issued certificate as a
# new version (`az keyvault certificate import`) before enabling the origin.
resource "azurerm_key_vault_certificate" "ingress" {
  name         = "lodestar-ingress-tls"
  key_vault_id = time_sleep.rbac.triggers["id"]

  certificate_policy {
    issuer_parameters {
      name = "Self"
    }

    key_properties {
      exportable = true
      key_type   = "RSA"
      key_size   = 2048
      reuse_key  = false
    }

    secret_properties {
      content_type = "application/x-pem-file"
    }

    x509_certificate_properties {
      subject            = "CN=${var.ingress_hostnames[0]}"
      validity_in_months = 12
      key_usage          = ["digitalSignature", "keyEncipherment"]
      extended_key_usage = ["1.3.6.1.5.5.7.3.1"]

      subject_alternative_names {
        dns_names = var.ingress_hostnames
      }
    }

    lifetime_action {
      action {
        action_type = "AutoRenew"
      }
      trigger {
        days_before_expiry = 30
      }
    }
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [certificate_policy, certificate]
  }
}
