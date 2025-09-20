output "resource_group_name" {
	value = azurerm_resource_group.rg.name
}

output "public_ip" {
	value = azurerm_public_ip.pubip.ip_address
}

output "vm_id" {
	value = azurerm_virtual_machine.vm.id
}
