output "resource_group_name" {
  value = azurerm_resource_group.this.name
}

output "aks_name" {
  value = module.aks.name
}

output "aks_host" {
  value     = module.aks.host
  sensitive = true
}

output "aks_cluster_ca_certificate" {
  value     = module.aks.cluster_ca_certificate
  sensitive = true
}

output "aks_oidc_issuer_url" {
  value = module.aks.oidc_issuer_url
}

output "aks_node_resource_group" {
  value = module.aks.node_resource_group
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "acr_name" {
  value = module.acr.name
}

output "key_vault_name" {
  value = module.keyvault.name
}

output "key_vault_uri" {
  value = module.keyvault.uri
}

output "postgres_fqdn" {
  value = module.postgres.fqdn
}

output "redis_hostname" {
  value = module.redis.hostname
}

output "log_analytics_workspace_id" {
  value = module.monitoring.workspace_id
}

output "nat_public_ip" {
  value = module.network.nat_public_ip
}

output "frontdoor_endpoints" {
  value = module.frontdoor.endpoint_hostnames
}

output "frontdoor_id" {
  value = module.frontdoor.frontdoor_id
}

output "tenant_id" {
  value = module.identity.tenant_id
}

output "entra_clients" {
  value = {
    api   = module.identity.api_client_id
    web   = module.identity.web_client_id
    field = module.identity.field_client_id
  }
}

output "api_identifier_uri" {
  value = module.identity.api_identifier_uri
}

output "workload_client_ids" {
  value = module.identity.workload_client_ids
}

# Paste into deploy/k8s/overlays/<env>/azure.env (non-secret wiring values).
output "kustomize_azure_env" {
  value = join("\n", concat([
    "TENANT_ID=${module.identity.tenant_id}",
    "KEYVAULT_NAME=${module.keyvault.name}",
    "API_CLIENT_ID=${module.identity.api_client_id}",
    "WEB_CLIENT_ID=${module.identity.web_client_id}",
    "FIELD_CLIENT_ID=${module.identity.field_client_id}",
    "AKS_USER_SUBNET=snet-aks-user",
    "INGRESS_INTERNAL_IP=${coalesce(var.ingress_internal_ip, "10.40.7.250")}",
    "ACR_LOGIN_SERVER=${module.acr.login_server}",
    "ISTIO_REVISION=${var.istio_revision}",
    "FRONTDOOR_ID=${module.frontdoor.frontdoor_id}",
    "PRIVATE_LINK_SUBNET=${module.network.private_link_subnet_name}",
    "POSTGRES_CIDR=${var.subnets.postgres}",
    "POSTGRES_HOST=${module.postgres.fqdn}",
    "PRIVATE_ENDPOINT_CIDR=${var.subnets.private_endpoints}",
    "WEB_HOST=${var.web_hostname}",
    "FIELD_HOST=${var.field_hostname}",
    ], [
    for k, v in module.identity.workload_client_ids : "CLIENT_ID_${upper(replace(k, "-", "_"))}=${v}"
  ]))
}

output "openai_endpoint" {
  value = var.enable_openai ? module.openai[0].endpoint : null
}
