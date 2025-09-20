#!/usr/bin/env bash
set -euo pipefail

if ! command -v terraform >/dev/null 2>&1; then
  echo "terraform not found. Please install Terraform >= 1.0"
  exit 1
fi

echo "Initializing Terraform..."
terraform init

echo "Run 'make plan' or 'make apply' from this directory to continue."
