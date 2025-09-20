terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "local" {}

module "example" {
  source   = "../modules/example"
  filename = "./generated/example.txt"
  content  = "Example content from cherry-picking test"
}

output "created_file" {
  value = module.example.filename
}
