data "azurerm_client_config" "current" {}

# Control-plane identity. User-assigned so it can be granted Network
# Contributor on the node subnets before the cluster exists.
resource "azurerm_user_assigned_identity" "control_plane" {
  name                = "id-${var.name}-aks"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = var.tags
}

resource "azurerm_role_assignment" "control_plane_subnet" {
  for_each             = { system = var.system_subnet_id, user = var.user_subnet_id, pls = var.private_link_subnet_id }
  scope                = each.value
  role_definition_name = "Network Contributor"
  principal_id         = azurerm_user_assigned_identity.control_plane.principal_id
}

resource "azurerm_kubernetes_cluster" "this" {
  name                = "aks-${var.name}"
  resource_group_name = var.resource_group_name
  location            = var.location
  dns_prefix          = "aks-${var.name}"
  node_resource_group = "rg-${var.name}-aks-nodes"
  kubernetes_version  = var.kubernetes_version
  sku_tier            = var.sku_tier

  automatic_upgrade_channel = "patch"
  node_os_upgrade_channel   = "NodeImage"

  private_cluster_enabled = var.private_cluster_enabled

  dynamic "api_server_access_profile" {
    for_each = var.private_cluster_enabled ? [] : [1]
    content {
      authorized_ip_ranges = var.api_server_authorized_ip_ranges
    }
  }

  # --- identity & access -----------------------------------------------------
  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.control_plane.id]
  }

  local_account_disabled            = true
  role_based_access_control_enabled = true

  azure_active_directory_role_based_access_control {
    tenant_id              = data.azurerm_client_config.current.tenant_id
    azure_rbac_enabled     = true
    admin_group_object_ids = var.admin_group_object_ids
  }

  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  # --- networking -------------------------------------------------------------
  network_profile {
    network_plugin      = "azure"
    network_plugin_mode = "overlay"
    network_data_plane  = "cilium"
    network_policy      = "cilium"
    pod_cidr            = var.pod_cidr
    service_cidr        = var.service_cidr
    dns_service_ip      = var.dns_service_ip
    outbound_type       = "userAssignedNATGateway"
    load_balancer_sku   = "standard"
  }

  # --- add-ons -------------------------------------------------------------------
  service_mesh_profile {
    mode                             = "Istio"
    revisions                        = [var.istio_revision]
    internal_ingress_gateway_enabled = true
    external_ingress_gateway_enabled = false
  }

  azure_policy_enabled = true

  microsoft_defender {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  oms_agent {
    log_analytics_workspace_id      = var.log_analytics_workspace_id
    msi_auth_for_monitoring_enabled = true
  }

  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  image_cleaner_enabled        = true
  image_cleaner_interval_hours = 48

  # --- system pool (critical add-ons only) ---------------------------------------
  default_node_pool {
    name                         = "system"
    vm_size                      = var.system_node_vm_size
    vnet_subnet_id               = var.system_subnet_id
    zones                        = var.zones
    auto_scaling_enabled         = true
    min_count                    = var.system_node_min
    max_count                    = var.system_node_max
    max_pods                     = 110
    os_sku                       = "AzureLinux"
    only_critical_addons_enabled = true
    host_encryption_enabled      = var.host_encryption_enabled
    temporary_name_for_rotation  = "systemtmp"
    tags                         = var.tags

    upgrade_settings {
      max_surge = "33%"
    }
  }

  maintenance_window_auto_upgrade {
    frequency   = "Weekly"
    interval    = 1
    day_of_week = "Sunday"
    duration    = 4
    start_time  = "20:00"
    utc_offset  = "+05:30"
  }

  tags = var.tags

  depends_on = [azurerm_role_assignment.control_plane_subnet]

  lifecycle {
    ignore_changes = [
      kubernetes_version, # patch channel upgrades in place
      default_node_pool[0].node_count,
    ]
  }
}

# --- user pool (workloads) -------------------------------------------------------
resource "azurerm_kubernetes_cluster_node_pool" "user" {
  name                    = "apps"
  kubernetes_cluster_id   = azurerm_kubernetes_cluster.this.id
  mode                    = "User"
  vm_size                 = var.user_node_vm_size
  vnet_subnet_id          = var.user_subnet_id
  zones                   = var.zones
  auto_scaling_enabled    = true
  min_count               = var.user_node_min
  max_count               = var.user_node_max
  max_pods                = 110
  os_sku                  = "AzureLinux"
  host_encryption_enabled = var.host_encryption_enabled
  node_labels             = { "lodestar.io/pool" = "apps" }
  tags                    = var.tags

  upgrade_settings {
    max_surge = "33%"
  }

  lifecycle {
    ignore_changes = [node_count]
  }
}

# Human operators get namespace-scoped rights through Entra groups.
resource "azurerm_role_assignment" "cluster_admins" {
  for_each             = toset(var.admin_group_object_ids)
  scope                = azurerm_kubernetes_cluster.this.id
  role_definition_name = "Azure Kubernetes Service RBAC Cluster Admin"
  principal_id         = each.value
}

# The principal running Terraform must reach the API to install Argo CD.
resource "azurerm_role_assignment" "deployer" {
  scope                = azurerm_kubernetes_cluster.this.id
  role_definition_name = "Azure Kubernetes Service RBAC Cluster Admin"
  principal_id         = data.azurerm_client_config.current.object_id
}
