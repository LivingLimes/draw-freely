locals {
  managed_by = "terraform"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-southeast-2"
}

data "aws_vpc" "vpc" {
  default = true
}

data "aws_subnet" "subnet" {
  vpc_id            = data.aws_vpc.vpc.id
  availability_zone = "${var.region}a"
  default_for_az    = true
}

data "aws_ami" "server" {
  most_recent = true
  owners      = ["amazon"]

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
  instance_type = "t2.nano"

  monitoring = false

  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
    encrypted             = true
    delete_on_termination = true
    tags = {
      Name        = "${var.app_name}-${var.environment}-root"
      Environment = var.environment
      Service     = var.app_name
      ManagedBy   = local.managed_by
    }
  }

  hibernation                          = false
  disable_api_termination              = false
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
    Name        = "${var.app_name}-${var.environment}"
    Environment = var.environment
    Service     = var.app_name
    ManagedBy   = local.managed_by
  }
}
