variable "vm_id" {
  description = "ID of the VM to attach the extension to"
  type        = string
}

variable "script" {
  description = "Script to run via Custom Script Extension"
  type        = string
  default     = "echo hello"
}

variable "enabled" {
  description = "Whether to create the extension"
  type        = bool
  default     = true
}

resource "azurerm_virtual_machine_extension" "custom_script" {
  count                = var.enabled ? 1 : 0
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
  value = try(azurerm_virtual_machine_extension.custom_script[0].name, "")
}
