data "azurerm_client_config" "current" {}

locals {
  admin_login = "lodestar_admin"
  fqdn        = azurerm_postgresql_flexible_server.this.fqdn
}

# ------------------------------------------------------------------ passwords
# Generated here, stored only in Key Vault (and in encrypted remote state).
resource "random_password" "admin" {
  length           = 32
  special          = true
  override_special = "-_.~"
}

resource "random_password" "service" {
  for_each         = toset(var.service_schemas)
  length           = 32
  special          = true
  override_special = "-_.~"
}

# ------------------------------------------------------------------ server
resource "azurerm_postgresql_flexible_server" "this" {
  name                          = "psql-${var.name}"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  version                       = "16"
  sku_name                      = var.sku_name
  storage_mb                    = var.storage_mb
  storage_tier                  = var.storage_tier
  auto_grow_enabled             = true
  zone                          = "1"
  backup_retention_days         = var.backup_retention_days
  geo_redundant_backup_enabled  = var.geo_redundant_backup_enabled
  delegated_subnet_id           = var.delegated_subnet_id
  private_dns_zone_id           = var.private_dns_zone_id
  public_network_access_enabled = false

  administrator_login    = local.admin_login
  administrator_password = random_password.admin.result

  # Entra auth for humans/ops; password auth stays on for the per-service
  # roles (Prisma uses a static DATABASE_URL). Disable it once services
  # fetch Entra tokens for Postgres via workload identity.
  authentication {
    active_directory_auth_enabled = true
    password_auth_enabled         = true
    tenant_id                     = data.azurerm_client_config.current.tenant_id
  }

  dynamic "high_availability" {
    for_each = var.high_availability ? [1] : []
    content {
      mode                      = "ZoneRedundant"
      standby_availability_zone = "2"
    }
  }

  maintenance_window {
    day_of_week  = 0
    start_hour   = 21
    start_minute = 0
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [zone, high_availability[0].standby_availability_zone]
  }
}

resource "azurerm_postgresql_flexible_server_active_directory_administrator" "admins" {
  count               = var.entra_admin_group_object_id == null ? 0 : 1
  server_name         = azurerm_postgresql_flexible_server.this.name
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  object_id           = var.entra_admin_group_object_id
  principal_name      = var.entra_admin_group_name
  principal_type      = "Group"
}

resource "azurerm_postgresql_flexible_server_configuration" "tls" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.this.id
  value     = "on"
}

resource "azurerm_postgresql_flexible_server_configuration" "min_tls" {
  name      = "ssl_min_protocol_version"
  server_id = azurerm_postgresql_flexible_server.this.id
  value     = "TLSv1.2"
}

resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.this.id
  value     = "PGCRYPTO,UUID-OSSP,CITEXT"
}

resource "azurerm_postgresql_flexible_server_configuration" "log_connections" {
  name      = "log_connections"
  server_id = azurerm_postgresql_flexible_server.this.id
  value     = "on"
}

# One database, one schema per service (PLATFORM.md section 1). Schemas and
# per-service roles are created by the migrate PreSync job (deploy/k8s).
resource "azurerm_postgresql_flexible_server_database" "lodestar" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.this.id
  charset   = "UTF8"
  collation = "en_US.utf8"

  lifecycle {
    prevent_destroy = true
  }
}

# ------------------------------------------------------------------ Key Vault
resource "azurerm_key_vault_secret" "admin_password" {
  name         = "postgres-admin-password"
  value        = random_password.admin.result
  key_vault_id = var.key_vault_id
  content_type = "password"
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "admin_url" {
  name         = "database-url-admin"
  value        = "postgresql://${local.admin_login}:${urlencode(random_password.admin.result)}@${local.fqdn}:5432/${var.database_name}?sslmode=require"
  key_vault_id = var.key_vault_id
  content_type = "connection-string"
  tags         = var.tags
}

resource "azurerm_key_vault_secret" "service_password" {
  for_each     = toset(var.service_schemas)
  name         = "db-password-${each.key}"
  value        = random_password.service[each.key].result
  key_vault_id = var.key_vault_id
  content_type = "password"
  tags         = var.tags
}

# Prisma-style URL: role svc_<schema>, search path = its own schema.
resource "azurerm_key_vault_secret" "service_url" {
  for_each     = toset(var.service_schemas)
  name         = "database-url-${each.key}"
  value        = "postgresql://svc_${each.key}:${urlencode(random_password.service[each.key].result)}@${local.fqdn}:5432/${var.database_name}?schema=${each.key}&sslmode=require"
  key_vault_id = var.key_vault_id
  content_type = "connection-string"
  tags         = var.tags
}
