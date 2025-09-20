variable "location" {
  description = "Azure region"
  type        = string
  default     = "westus2"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "rg-cherry-west"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "admin_password" {
  description = "Admin password for the VM (placeholder)"
  type        = string
  default     = "P@ssw0rd-West!"
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key for the VM"
  type        = string
  default     = ""
}
