TF_DIR := $(CURDIR)

.PHONY: init plan apply destroy

init:
	cd $(TF_DIR) && terraform init

plan:
	cd $(TF_DIR) && terraform plan -var-file="example.tfvars"

apply:
	cd $(TF_DIR) && terraform apply -var-file="example.tfvars" -auto-approve

destroy:
	cd $(TF_DIR) && terraform destroy -var-file="example.tfvars" -auto-approve
