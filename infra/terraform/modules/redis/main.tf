# Azure Cache for Redis for the Socket.IO Redis adapter (notifications). It
# carries pub/sub only (room emits fanned out across replicas), nothing is
# persisted, so no RDB/AOF and no data-plane backups.
# Private: no public access, reached from AKS through a private endpoint in
# snet-private-endpoints; TLS only (port 6380, TLS 1.2+).
#
# Note: Microsoft is retiring Azure Cache for Redis in favour of Azure Managed
# Redis. The adapter only needs a Redis URL, so swapping this module for an
# azurerm_managed_redis one changes nothing in the cluster (same Key Vault
# secret name, same NetworkPolicy port if 10000 is opened instead of 6380).

locals {
  premium = var.sku_name == "Premium"
}

resource "azurerm_redis_cache" "this" {
  name                          = var.name
  resource_group_name           = var.resource_group_name
  location                      = var.location
  sku_name                      = var.sku_name
  family                        = local.premium ? "P" : "C"
  capacity                      = var.capacity
  zones                         = local.premium && length(var.zones) > 0 ? var.zones : null
  replicas_per_primary          = local.premium ? var.replicas_per_primary : null
  redis_version                 = "6"
  non_ssl_port_enabled          = false
  minimum_tls_version           = "1.2"
  public_network_access_enabled = false

  redis_configuration {
    # pub/sub only: nothing worth keeping, so evict rather than reject writes
    maxmemory_policy = "allkeys-lru"
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
    private_connection_resource_id = azurerm_redis_cache.this.id
    subresource_names              = ["redisCache"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "redis"
    private_dns_zone_ids = [var.private_dns_zone_id]
  }

  tags = var.tags
}

# rediss:// URL with the access key; only the notifications workload identity
# may read it (per-secret RBAC in modules/identity via modules/platform).
resource "azurerm_key_vault_secret" "redis_url" {
  name         = "redis-url"
  value        = "rediss://:${urlencode(azurerm_redis_cache.this.primary_access_key)}@${azurerm_redis_cache.this.hostname}:${azurerm_redis_cache.this.ssl_port}"
  key_vault_id = var.key_vault_id
  content_type = "connection-string"
  tags         = var.tags
}
