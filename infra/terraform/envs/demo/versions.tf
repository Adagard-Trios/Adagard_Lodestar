terraform {
  required_version = ">= 1.7.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
  # Local state on the operator's machine: one small environment, applied by hand (deploy/azure-demo/README.md).
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}
