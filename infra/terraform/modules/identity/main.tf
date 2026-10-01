data "azuread_client_config" "current" {}

locals {
  # Human roles (PLATFORM.md section 2.3) and the service role.
  user_roles = {
    store_manager = "Store manager: own outlet only (outlet_id claim)."
    dispatcher    = "Dispatcher: plans, deferrals, trips for their depots."
    loader        = "Loader: load records at the depot."
    driver        = "Driver: own vehicle's trips (vehicle_id claim)."
    admin         = "Administrator: people, devices, rules, audit."
  }

  # Application permissions carried by service (workload identity) tokens.
  # app-only tokens carry `roles`, so these are app roles, not scopes.
  service_permissions = sort(distinct(flatten([for w in values(var.workloads) : w.api_roles])))

  all_app_roles = merge(
    { for r, d in local.user_roles : r => { description = d, member_types = ["User"] } },
    { svc = { description = "Service-to-service caller (workload identity).", member_types = ["Application"] } },
    { for p in local.service_permissions : p => { description = "Service permission ${p}.", member_types = ["Application"] } },
  )

  owners = distinct(concat([data.azuread_client_config.current.object_id], var.app_owner_object_ids))
}

resource "random_uuid" "app_role" {
  for_each = local.all_app_roles
}

resource "random_uuid" "scope_access" {}

# ============================================================== lodestar-api
resource "azuread_application" "api" {
  display_name     = "lodestar-api-${var.environment}"
  owners           = local.owners
  sign_in_audience = "AzureADMyOrg"

  api {
    requested_access_token_version = 2

    oauth2_permission_scope {
      id                         = random_uuid.scope_access.result
      value                      = "access_as_user"
      type                       = "User"
      enabled                    = true
      admin_consent_display_name = "Access Waypoint Lodestar"
      admin_consent_description  = "Call the Waypoint Lodestar OData API as the signed-in user."
      user_consent_display_name  = "Access Waypoint Lodestar"
      user_consent_description   = "Call the Waypoint Lodestar API on your behalf."
    }
  }

  dynamic "app_role" {
    for_each = local.all_app_roles
    content {
      id                   = random_uuid.app_role[app_role.key].result
      value                = app_role.key
      display_name         = app_role.key
      description          = app_role.value.description
      allowed_member_types = app_role.value.member_types
      enabled              = true
    }
  }

  optional_claims {
    access_token {
      name = "groups"
    }
    access_token {
      name = "idtyp" # distinguishes app-only (service) from user tokens
    }
  }

  group_membership_claims = ["ApplicationGroup"]

  tags = ["lodestar", var.environment]

  lifecycle {
    # Managed by azuread_application_identifier_uri / _pre_authorized below.
    ignore_changes = [identifier_uris, api[0].known_client_applications]
  }
}

# api://<client-id> is accepted by tenants that restrict identifier URIs.
resource "azuread_application_identifier_uri" "api" {
  application_id = azuread_application.api.id
  identifier_uri = "api://${azuread_application.api.client_id}"
}

resource "azuread_service_principal" "api" {
  client_id                    = azuread_application.api.client_id
  owners                       = local.owners
  app_role_assignment_required = true # only assigned users/groups/workloads get tokens
  tags                         = ["lodestar", var.environment]
}

# Map Entra groups to app roles (e.g. lodestar-dispatchers -> dispatcher).
resource "azuread_app_role_assignment" "groups" {
  for_each            = var.role_group_object_ids
  app_role_id         = random_uuid.app_role[each.key].result
  principal_object_id = each.value
  resource_object_id  = azuread_service_principal.api.object_id
}

# ============================================================== lodestar-web (SPA)
resource "azuread_application" "web" {
  display_name     = "lodestar-web-${var.environment}"
  owners           = local.owners
  sign_in_audience = "AzureADMyOrg"

  single_page_application {
    redirect_uris = var.web_redirect_uris
  }

  required_resource_access {
    resource_app_id = azuread_application.api.client_id

    resource_access {
      id   = random_uuid.scope_access.result
      type = "Scope"
    }
  }

  tags = ["lodestar", var.environment]
}

resource "azuread_service_principal" "web" {
  client_id = azuread_application.web.client_id
  owners    = local.owners
}

# ============================================================== lodestar-field (public client)
resource "azuread_application" "field" {
  display_name                   = "lodestar-field-${var.environment}"
  owners                         = local.owners
  sign_in_audience               = "AzureADMyOrg"
  fallback_public_client_enabled = true

  public_client {
    redirect_uris = var.field_redirect_uris
  }

  # The Expo web build (mobile-web) signs in as an SPA with the same client.
  single_page_application {
    redirect_uris = var.field_spa_redirect_uris
  }

  required_resource_access {
    resource_app_id = azuread_application.api.client_id

    resource_access {
      id   = random_uuid.scope_access.result
      type = "Scope"
    }
  }

  tags = ["lodestar", var.environment]
}

resource "azuread_service_principal" "field" {
  client_id = azuread_application.field.client_id
  owners    = local.owners
}

# Pre-authorise first-party clients so users are not prompted for consent.
resource "azuread_application_pre_authorized" "web" {
  application_id       = azuread_application.api.id
  authorized_client_id = azuread_application.web.client_id
  permission_ids       = [random_uuid.scope_access.result]
}

resource "azuread_application_pre_authorized" "field" {
  application_id       = azuread_application.api.id
  authorized_client_id = azuread_application.field.client_id
  permission_ids       = [random_uuid.scope_access.result]
}

# ============================================================== workload identities
# One user-assigned identity per Kubernetes service account. Replaces the
# per-service confidential clients (svc-*) of the local Keycloak setup: the
# pod exchanges its projected SA token (client assertion) for an Entra token,
# so there is no client secret anywhere.
resource "azurerm_user_assigned_identity" "workload" {
  for_each            = var.workloads
  name                = "id-${var.name}-${each.key}"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = merge(var.tags, { workload = each.key })
}

resource "azurerm_federated_identity_credential" "workload" {
  for_each            = var.workloads
  name                = "fic-${each.key}"
  resource_group_name = var.resource_group_name
  parent_id           = azurerm_user_assigned_identity.workload[each.key].id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = var.oidc_issuer_url
  subject             = "system:serviceaccount:${each.value.namespace}:${each.value.service_account}"
}

# svc + least-privilege permissions on lodestar-api for each workload.
locals {
  workload_role_pairs = merge([
    for w, cfg in var.workloads : {
      for r in cfg.api_roles : "${w}/${r}" => { workload = w, role = r }
    }
  ]...)

  workload_secret_pairs = merge([
    for w, cfg in var.workloads : {
      for i, sid in cfg.key_vault_secret_ids : "${w}/${i}" => { workload = w, scope = sid }
    }
  ]...)
}

resource "azuread_app_role_assignment" "workload" {
  for_each            = local.workload_role_pairs
  app_role_id         = random_uuid.app_role[each.value.role].result
  principal_object_id = azurerm_user_assigned_identity.workload[each.value.workload].principal_id
  resource_object_id  = azuread_service_principal.api.object_id
}

# Key Vault Secrets User scoped to the individual secrets each workload needs.
resource "azurerm_role_assignment" "workload_secrets" {
  for_each                         = local.workload_secret_pairs
  scope                            = each.value.scope
  role_definition_name             = "Key Vault Secrets User"
  principal_id                     = azurerm_user_assigned_identity.workload[each.value.workload].principal_id
  skip_service_principal_aad_check = true
}

# Workloads that pull artefacts from ACR at runtime (none by default; nodes
# pull images with the kubelet identity).
resource "azurerm_role_assignment" "workload_acr_pull" {
  for_each                         = { for w, cfg in var.workloads : w => cfg if cfg.acr_pull }
  scope                            = var.acr_id
  role_definition_name             = "AcrPull"
  principal_id                     = azurerm_user_assigned_identity.workload[each.key].principal_id
  skip_service_principal_aad_check = true
}

# CI (Jenkins) pushes signed images.
resource "azurerm_role_assignment" "ci_acr_push" {
  count                = var.ci_principal_object_id == null ? 0 : 1
  scope                = var.acr_id
  role_definition_name = "AcrPush"
  principal_id         = var.ci_principal_object_id
}
