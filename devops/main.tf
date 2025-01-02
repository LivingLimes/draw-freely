locals {
  managed_by  = "terraform"
  name_prefix = "${var.app_name}-${var.environment}"
}

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      ManagedBy   = local.managed_by
      Environment = var.environment
      Service     = var.app_name
      CostCenter = var.cost_center
    }
  }
}

data "aws_ami" "server" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "state"
    values = ["available"]
  }

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.server.id
  instance_type = var.instance_type
  availability_zone = "${var.region}a"

  monitoring = false

  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
    encrypted             = true
    delete_on_termination = true
    tags = {
      Name = "${local.name_prefix}-root"
    }
  }

  hibernation             = false
  disable_api_termination = var.disable_api_termination
  # consider setting this to true for newer instance types
  ebs_optimized                        = false
  instance_initiated_shutdown_behavior = "stop"

  credit_specification {
    cpu_credits = "standard"
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "disabled"
  }

  maintenance_options {
    auto_recovery = "default"
  }

  tags = {
    Name = local.name_prefix
  }
}