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

  # --- autoscaling (docs/architecture/PLATFORM.md section 9) -------------------------
  # KEDA as a managed add-on: event-driven ScaledObjects for the agent (active
  # LangGraph runs) and sync (offline-event replay) next to the plain HPAs.
  workload_autoscaler_profile {
    keda_enabled                    = var.keda_enabled
    vertical_pod_autoscaler_enabled = var.vpa_enabled
  }

  # Cluster autoscaler, shared by every pool that has auto_scaling_enabled.
  # Scale up fast (pending pods are noticed within scan_interval, new pods are
  # not held back), scale down conservatively (a node must be under-used for
  # scale_down_unneeded, and not right after a scale-up), and balance the
  # per-zone pools so the zone topology spread of the workloads stays satisfiable.
  auto_scaler_profile {
    balance_similar_node_groups                   = true
    expander                                      = var.autoscaler_profile.expander
    scan_interval                                 = var.autoscaler_profile.scan_interval
    new_pod_scale_up_delay                        = "0s"
    max_node_provisioning_time                    = "15m"
    max_unready_nodes                             = 3
    max_unready_percentage                        = 45
    scale_down_delay_after_add                    = var.autoscaler_profile.scale_down_delay_after_add
    scale_down_delay_after_delete                 = var.autoscaler_profile.scan_interval
    scale_down_delay_after_failure                = "3m"
    scale_down_unneeded                           = var.autoscaler_profile.scale_down_unneeded
    scale_down_unready                            = "20m"
    scale_down_utilization_threshold              = var.autoscaler_profile.scale_down_utilization_threshold
    max_graceful_termination_sec                  = 600
    empty_bulk_delete_max                         = 10
    skip_nodes_with_local_storage                 = false
    skip_nodes_with_system_pods                   = true
    daemonset_eviction_for_empty_nodes_enabled    = true
    daemonset_eviction_for_occupied_nodes_enabled = true
    ignore_daemonsets_utilization_enabled         = true
  }

  # --- system pool (critical add-ons only) ---------------------------------------
  # Kept small: the CriticalAddonsOnly taint keeps workloads off it; it only
  # grows for add-ons (CoreDNS, Istio control plane, KEDA, metrics-server).
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

# --- user pools (workloads) ------------------------------------------------------
# One pool per availability zone (user_pool_per_zone = true, prod) so the
# cluster autoscaler adds a node in exactly the zone whose pods are pending:
# the workloads spread across zones with whenUnsatisfiable: DoNotSchedule,
# which a single multi-zone scale set cannot satisfy reliably. With
# balance_similar_node_groups the zones grow together. dev runs one pool
# across the zones (user_pool_per_zone = false) to keep the node count low.
locals {
  user_pools = var.user_pool_per_zone ? {
    for z in var.zones : "apps${z}" => { zones = [z], min = var.user_node_min, max = var.user_node_max }
    } : {
    apps = { zones = var.zones, min = var.user_node_min, max = var.user_node_max }
  }
}

resource "azurerm_kubernetes_cluster_node_pool" "user" {
  for_each                = local.user_pools
  name                    = each.key
  kubernetes_cluster_id   = azurerm_kubernetes_cluster.this.id
  mode                    = "User"
  vm_size                 = var.user_node_vm_size
  vnet_subnet_id          = var.user_subnet_id
  zones                   = each.value.zones
  auto_scaling_enabled    = true
  min_count               = each.value.min
  max_count               = each.value.max
  max_pods                = 110
  os_sku                  = "AzureLinux"
  host_encryption_enabled = var.host_encryption_enabled
  node_labels             = { "lodestar.io/pool" = "apps" }
  tags                    = var.tags

  upgrade_settings {
    max_surge                     = "33%"
    drain_timeout_in_minutes      = 30
    node_soak_duration_in_minutes = 0
  }

  lifecycle {
    ignore_changes = [node_count]
  }
}

# --- optional spot pool for the planning agent ------------------------------------
# Azure spot VMs at a large discount. AKS taints them
# kubernetes.azure.com/scalesetpriority=spot:NoSchedule, so only pods that
# tolerate it land here: the agent (deploy/k8s/base/services/agent), which
# prefers spot and falls back to the apps pools. An eviction only delays a
# run: LangGraph checkpoints live in Postgres. min 0, so it costs nothing idle.
resource "azurerm_kubernetes_cluster_node_pool" "agent_spot" {
  count                   = var.agent_spot_pool.enabled ? 1 : 0
  name                    = "agentspot"
  kubernetes_cluster_id   = azurerm_kubernetes_cluster.this.id
  mode                    = "User"
  vm_size                 = var.agent_spot_pool.vm_size
  vnet_subnet_id          = var.user_subnet_id
  zones                   = var.zones
  auto_scaling_enabled    = true
  min_count               = 0
  max_count               = var.agent_spot_pool.max_count
  max_pods                = 110
  os_sku                  = "AzureLinux"
  host_encryption_enabled = var.host_encryption_enabled
  priority                = "Spot"
  eviction_policy         = "Delete"
  spot_max_price          = var.agent_spot_pool.max_price
  node_labels = {
    "lodestar.io/pool"                      = "agent-spot"
    "kubernetes.azure.com/scalesetpriority" = "spot"
  }
  node_taints = ["kubernetes.azure.com/scalesetpriority=spot:NoSchedule"]
  tags        = var.tags

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

# The single "apps" pool became a map (per zone, or one "apps" across zones).
# dev keeps its pool in place; prod replaces "apps" with apps1..apps3.
moved {
  from = azurerm_kubernetes_cluster_node_pool.user
  to   = azurerm_kubernetes_cluster_node_pool.user["apps"]
}
