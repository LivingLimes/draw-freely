# Devops

## Terraform Scripts

### One time set up
1. [Install aws cli (v2.22.21)](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
2. Create an IAM role linked to your root AWS account with full EC2 instance access and full Route53 access (I understand that these are overly permissive and will restrict them later).
3. Configure your AWS CLI to connect to your IAM role using `aws configure`.
4. [Install terraform (v5.82.2)](https://developer.hashicorp.com/terraform/install).


### Running scripts
All commands are executed from the `devops/` directory.
1. Initialise terraform and download required providers and modules.

```sh
terraform init
```

2. Dry run your terraform script.

```sh
terraform plan -out-var=prod.tfvars" -out=tfplan
```

3. Apply requested plan created in the last step.

```sh
terraform apply -var-file="prod.tfvars" "tfplan"
```

### Reverting scripts

1. Revert your complete script run.

```sh
terraform destroy -var-file="prod.tfvars"
```

### Convenience script
1. Destroy existing infrastructure and recreate it with your latest terraform changes.

```sh
terraform destroy -var-file="prod.tfvars" && terraform plan -var-file="prod.tfvars" -out=tfplan && terraform apply -var-file="prod.tfvars" "tfplan"
```

