provider "azurerm" {
  subscription_id     = var.subscription_id # null => ARM_SUBSCRIPTION_ID
  storage_use_azuread = true

  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}

provider "azuread" {}

# AKS has local accounts disabled: the Kubernetes/Helm providers authenticate
# with an Entra token from kubelogin (azurecli locally; workloadidentity/spn
# in Jenkins via AAD_* / AZURE_* environment variables).
locals {
  kubelogin_args = [
    "get-token",
    "--login", var.kubelogin_mode,
    "--server-id", "6dae42f8-4368-4678-94ff-3960e28e3630", # AKS AAD server app (well-known)
    "--environment", "AzurePublicCloud",
  ]
}

provider "kubernetes" {
  host                   = module.platform.aks_host
  cluster_ca_certificate = base64decode(module.platform.aks_cluster_ca_certificate)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "kubelogin"
    args        = local.kubelogin_args
  }
}

provider "helm" {
  kubernetes {
    host                   = module.platform.aks_host
    cluster_ca_certificate = base64decode(module.platform.aks_cluster_ca_certificate)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "kubelogin"
      args        = local.kubelogin_args
    }
  }
}
