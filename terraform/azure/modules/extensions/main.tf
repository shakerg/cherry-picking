variable "vm_id" {
  description = "ID of the VM to attach the extension to"
  type        = string
}

variable "script" {
  description = "Script to run via Custom Script Extension"
  type        = string
}

resource "azurerm_virtual_machine_extension" "custom_script" {
  name                 = "customScript"
  virtual_machine_id   = var.vm_id
  publisher            = "Microsoft.Azure.Extensions"
  type                 = "CustomScript"
  type_handler_version = "2.0"

  settings = jsonencode({
    commandToExecute = var.script
  })
}

output "extension_name" {
  value = azurerm_virtual_machine_extension.custom_script.name
}
