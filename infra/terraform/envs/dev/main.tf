# Waypoint Lodestar - dev environment.
# Cost-lean: Free AKS tier, public API restricted to deployer IPs, burstable
# Postgres without HA, WAF in Prevention mode, Argo CD auto-sync.

module "platform" {
  source = "../../modules/platform"

  project       = "lodestar"
  environment   = "dev"
  location      = var.location
  unique_suffix = var.unique_suffix

  # access
  deployer_ip_ranges              = var.deployer_ip_ranges
  platform_admin_group_object_ids = var.platform_admin_group_object_ids
  db_admin_group_object_id        = var.db_admin_group_object_id
  role_group_object_ids           = var.role_group_object_ids
  app_owner_object_ids            = var.app_owner_object_ids
  ci_principal_object_id          = var.ci_principal_object_id

  # network
  vnet_address_space = "10.40.0.0/16"
  zones              = ["1", "2", "3"]

  # AKS
  aks_sku_tier        = "Free"
  aks_private_cluster = false
  istio_revision      = "asm-1-26"
  system_node_vm_size = "Standard_D2ds_v5"
  system_node_min     = 1
  system_node_max     = 2
  user_node_vm_size   = "Standard_D4ds_v5"
  user_node_min       = 1
  user_node_max       = 3

  # data
  acr_zone_redundancy            = false
  postgres_sku                   = "B_Standard_B2s"
  postgres_storage_mb            = 32768
  postgres_high_availability     = false
  postgres_backup_retention_days = 7
  postgres_geo_redundant_backup  = false
  log_retention_days             = 30

  # edge
  web_hostname              = var.web_hostname
  field_hostname            = var.field_hostname
  frontdoor_origin_enabled  = var.frontdoor_origin_enabled
  ingress_internal_ip       = var.ingress_internal_ip
  waf_mode                  = "Prevention"
  waf_rate_limit_per_minute = 1000

  # AI (declared, off)
  enable_openai = var.enable_openai

  # GitOps
  install_argocd      = true
  git_repo_url        = var.git_repo_url
  git_target_revision = "main"
  git_repo_password   = var.git_repo_password
}
