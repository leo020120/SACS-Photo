provider "azurerm" {
  features {}
}

resource "azurerm_bastion_host" "ai_bot_dev" {
  name                = "digitalcampus-ai-search-vnet-bastion-new"
  resource_group_name = "dev-ecc-001-rg"
  location            = "UKSouth"  # Update with the appropriate region
  scale_units         = 2
  sku                 = "Standard"  # Change to Standard SKU

  ip_configuration {
    name                 = "ipConf"
    subnet_id            = "/subscriptions/314ffcd2-5b05-4c78-befc-637f1a5d617e/resourceGroups/dev-ecc-001-rg/providers/Microsoft.Network/virtualNetworks/digitalcampus-ai-search-vnet/subnets/AzureBastionSubnet"
    public_ip_address_id = azurerm_public_ip.bastion_IP.id
  }
}

resource "azurerm_public_ip" "bastion_IP" {
  name                = "bastion_IP"
  resource_group_name = "dev-ecc-001-rg"
  location            = "uksouth"
  allocation_method   = "Static"  # Must be Static for Standard SKU
  sku                 = "Standard"  # Set to Standard SKU
}
