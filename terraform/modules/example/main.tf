terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

resource "local_file" "example" {
  content  = var.content
  filename = var.filename
}

output "filename" {
  value = local_file.example.filename
}
