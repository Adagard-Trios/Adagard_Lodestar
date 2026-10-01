terraform {
  required_version = ">= 1.7.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
  # Bootstrap state is local on purpose: this folder creates the remote state
  # storage used by envs/*. Keep bootstrap/terraform.tfstate out of git (see
  # .gitignore) or migrate it into the created account afterwards.
}

provider "azurerm" {
  features {}
  subscription_id     = var.subscription_id
  storage_use_azuread = true
}
