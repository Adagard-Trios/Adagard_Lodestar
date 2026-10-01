output "resource_group_name" {
  value = module.platform.resource_group_name
}

output "aks_name" {
  value = module.platform.aks_name
}

output "aks_oidc_issuer_url" {
  value = module.platform.aks_oidc_issuer_url
}

output "acr_login_server" {
  value = module.platform.acr_login_server
}

output "key_vault_name" {
  value = module.platform.key_vault_name
}

output "postgres_fqdn" {
  value = module.platform.postgres_fqdn
}

output "frontdoor_endpoints" {
  value = module.platform.frontdoor_endpoints
}

output "nat_public_ip" {
  value = module.platform.nat_public_ip
}

output "entra_clients" {
  value = module.platform.entra_clients
}

output "tenant_id" {
  value = module.platform.tenant_id
}

output "workload_client_ids" {
  value = module.platform.workload_client_ids
}

output "kustomize_azure_env" {
  description = "terraform output -raw kustomize_azure_env > ../../../../deploy/k8s/overlays/<env>/azure.env"
  value       = module.platform.kustomize_azure_env
}
