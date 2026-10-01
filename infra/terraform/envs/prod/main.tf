# Waypoint Lodestar - prod environment.
# Standard AKS tier (uptime SLA), private API server, zone-redundant ACR and
# Postgres HA, geo-redundant backups, Argo CD manual sync with sync windows.

module "platform" {
  source = "../../modules/platform"

  project       = "lodestar"
  environment   = "prod"
  location      = var.location
  unique_suffix = var.unique_suffix

  # access
  deployer_ip_ranges              = var.deployer_ip_ranges
  platform_admin_group_object_ids = var.platform_admin_group_object_ids
  db_admin_group_object_id        = var.db_admin_group_object_id
  role_group_object_ids           = var.role_group_object_ids
  app_owner_object_ids            = var.app_owner_object_ids
  ci_principal_object_id          = var.ci_principal_object_id

  # network (separate VNet; ranges kept identical so manifests match)
  vnet_address_space = "10.40.0.0/16"
  zones              = ["1", "2", "3"]

  # AKS
  aks_sku_tier        = "Standard"
  aks_private_cluster = true
  istio_revision      = "asm-1-26"
  system_node_vm_size = "Standard_D4ds_v5"
  system_node_min     = 3
  system_node_max     = 5
  user_node_vm_size   = "Standard_D8ds_v5"
  # per zone: 1-4 nodes in each of zones 1, 2, 3 (3-12 in total)
  user_pool_per_zone = true
  user_node_min      = 1
  user_node_max      = 4
  aks_autoscaler_profile = {
    expander                         = "least-waste"
    scale_down_unneeded              = "10m"
    scale_down_delay_after_add       = "10m"
    scale_down_utilization_threshold = "0.5"
  }
  # the planning agent prefers spot nodes (tainted, min 0) and falls back to apps
  agent_spot_pool = {
    enabled   = true
    vm_size   = "Standard_D4ds_v5"
    max_count = 4
  }

  # data
  acr_zone_redundancy            = true
  postgres_sku                   = "GP_Standard_D4ds_v5"
  postgres_storage_mb            = 131072
  postgres_high_availability     = true
  postgres_backup_retention_days = 35
  postgres_geo_redundant_backup  = true
  log_retention_days             = 90
  redis_sku_name                 = "Premium"
  redis_capacity                 = 1

  # edge
  web_hostname                    = var.web_hostname
  field_hostname                  = var.field_hostname
  frontdoor_origin_enabled        = var.frontdoor_origin_enabled
  ingress_internal_ip             = var.ingress_internal_ip
  waf_mode                        = "Prevention"
  waf_rate_limit_per_minute       = 600
  waf_write_rate_limit_per_minute = 120
  waf_geo_allow_countries         = ["LK"]

  # AI (declared, off)
  enable_openai = var.enable_openai

  # GitOps
  install_argocd      = true
  git_repo_url        = var.git_repo_url
  git_target_revision = "main"
  git_repo_password   = var.git_repo_password
}
