locals {
  # One endpoint per face so the origin Host header (and therefore the Istio
  # VirtualService host match) is fixed per endpoint.
  sites = {
    web   = { host = var.web_hostname }
    field = { host = var.field_hostname }
  }
  waf_name = replace("waf${var.name}", "-", "")
}

resource "azurerm_cdn_frontdoor_profile" "this" {
  name                     = "afd-${var.name}"
  resource_group_name      = var.resource_group_name
  sku_name                 = "Premium_AzureFrontDoor"
  response_timeout_seconds = 120
  tags                     = var.tags
}

# ------------------------------------------------------------------ WAF
resource "azurerm_cdn_frontdoor_firewall_policy" "this" {
  name                              = local.waf_name
  resource_group_name               = var.resource_group_name
  sku_name                          = azurerm_cdn_frontdoor_profile.this.sku_name
  enabled                           = true
  mode                              = var.waf_mode
  request_body_check_enabled        = true
  custom_block_response_status_code = 403

  managed_rule {
    type    = "Microsoft_DefaultRuleSet"
    version = "2.1"
    action  = "Block"
  }

  managed_rule {
    type    = "Microsoft_BotManagerRuleSet"
    version = "1.1"
    action  = "Block"
  }

  # Per-client-IP rate limit on the whole site.
  custom_rule {
    name                           = "RateLimitPerIp"
    enabled                        = true
    priority                       = 100
    type                           = "RateLimitRule"
    action                         = "Block"
    rate_limit_duration_in_minutes = 1
    rate_limit_threshold           = var.rate_limit_per_minute

    match_condition {
      match_variable = "RequestUri"
      operator       = "BeginsWith"
      match_values   = ["/"]
    }
  }

  # Tighter limit on command endpoints (OData actions and writes).
  custom_rule {
    name                           = "RateLimitODataWrites"
    enabled                        = true
    priority                       = 110
    type                           = "RateLimitRule"
    action                         = "Block"
    rate_limit_duration_in_minutes = 1
    rate_limit_threshold           = var.write_rate_limit_per_minute

    match_condition {
      match_variable = "RequestMethod"
      operator       = "Equal"
      match_values   = ["POST", "PATCH", "PUT", "DELETE"]
    }

    match_condition {
      match_variable = "RequestUri"
      operator       = "Contains"
      match_values   = ["/odata/v4/"]
    }
  }

  # Health endpoints are never exposed at the edge.
  custom_rule {
    name     = "BlockHealthEndpoints"
    enabled  = true
    priority = 50
    type     = "MatchRule"
    action   = "Block"

    match_condition {
      match_variable = "RequestUri"
      operator       = "RegEx"
      match_values   = ["(?i)/(health|ready)(\\?|$)"]
    }
  }

  dynamic "custom_rule" {
    for_each = length(var.geo_allow_countries) > 0 ? [1] : []
    content {
      name     = "GeoAllowList"
      enabled  = true
      priority = 10
      type     = "MatchRule"
      action   = "Block"

      match_condition {
        match_variable     = "SocketAddr"
        operator           = "GeoMatch"
        negation_condition = true
        match_values       = var.geo_allow_countries
      }
    }
  }

  tags = var.tags
}

# ------------------------------------------------------------------ endpoints
resource "azurerm_cdn_frontdoor_endpoint" "site" {
  for_each                 = local.sites
  name                     = "fde-${var.name}-${each.key}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.this.id
  tags                     = var.tags
}

resource "azurerm_cdn_frontdoor_custom_domain" "site" {
  for_each                 = var.custom_domains_enabled ? local.sites : {}
  name                     = "cd-${each.key}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.this.id
  host_name                = each.value.host
  dns_zone_id              = var.dns_zone_id

  tls {
    certificate_type = "ManagedCertificate"
  }
}

resource "azurerm_cdn_frontdoor_security_policy" "waf" {
  name                     = "sp-${var.name}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.this.id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = azurerm_cdn_frontdoor_firewall_policy.this.id

      association {
        patterns_to_match = ["/*"]

        dynamic "domain" {
          for_each = azurerm_cdn_frontdoor_endpoint.site
          content {
            cdn_frontdoor_domain_id = domain.value.id
          }
        }

        dynamic "domain" {
          for_each = azurerm_cdn_frontdoor_custom_domain.site
          content {
            cdn_frontdoor_domain_id = domain.value.id
          }
        }
      }
    }
  }
}

# ------------------------------------------------------------------ origins
# Origin = the Istio internal ingress gateway, reached through a Private Link
# Service that AKS creates from the annotated Service in
# deploy/k8s/base/istio/ingress-pls-service.yaml. The PLS only exists after
# Argo CD has synced, so origins/routes are behind origin_enabled (2nd apply).
resource "azurerm_cdn_frontdoor_origin_group" "site" {
  for_each                 = var.origin_enabled ? local.sites : {}
  name                     = "og-${each.key}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.this.id
  session_affinity_enabled = false

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
  }

  health_probe {
    path                = "/"
    protocol            = "Https"
    request_type        = "HEAD"
    interval_in_seconds = 60
  }
}

resource "azurerm_cdn_frontdoor_origin" "site" {
  for_each                       = var.origin_enabled ? local.sites : {}
  name                           = "origin-istio-${each.key}"
  cdn_frontdoor_origin_group_id  = azurerm_cdn_frontdoor_origin_group.site[each.key].id
  enabled                        = true
  host_name                      = var.origin_private_ip
  origin_host_header             = each.value.host
  https_port                     = 443
  http_port                      = 80
  certificate_name_check_enabled = true
  priority                       = 1
  weight                         = 1000

  private_link {
    request_message        = "Front Door ${var.name} -> Istio ingress (${each.key})"
    location               = var.location
    private_link_target_id = var.private_link_service_id
  }
}

resource "azurerm_cdn_frontdoor_route" "site" {
  for_each                        = var.origin_enabled ? local.sites : {}
  name                            = "route-${each.key}"
  cdn_frontdoor_endpoint_id       = azurerm_cdn_frontdoor_endpoint.site[each.key].id
  cdn_frontdoor_origin_group_id   = azurerm_cdn_frontdoor_origin_group.site[each.key].id
  cdn_frontdoor_origin_ids        = [azurerm_cdn_frontdoor_origin.site[each.key].id]
  cdn_frontdoor_custom_domain_ids = var.custom_domains_enabled ? [azurerm_cdn_frontdoor_custom_domain.site[each.key].id] : []
  supported_protocols             = ["Http", "Https"]
  https_redirect_enabled          = true
  forwarding_protocol             = "HttpsOnly"
  patterns_to_match               = ["/*"]
  link_to_default_domain          = true
  enabled                         = true
}
