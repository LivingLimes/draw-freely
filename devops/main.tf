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

resource aws_security_group security_group {
  name = "${var.app_name}-${var.environment}-sg"
  description = "Security group for just-let-me-draw game"
  vpc_id = data.aws_vpc.vpc.id

  tags = {
    Name = "${var.app_name}-${var.environment}-sg"
    Environment = var.environment
    Service = var.app_name
    ManagedBy = local.managed_by
  }

  lifecycle {
    create_before_destroy = false
  }
}

resource aws_vpc_security_group_ingress_rule https_wss_ingress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"

  description = "HTTPS and WSS traffic."
  from_port = 443
  to_port = 443
  cidr_ipv4 = "0.0.0.0/0"
}

resource aws_vpc_security_group_ingress_rule http_ingress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"

  description = "HTTP for HTTPS redirect."
  from_port = 80
  to_port = 80
  cidr_ipv4 = "0.0.0.0/0"
}

resource aws_vpc_security_group_ingress_rule ssh_ingress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"

  description = "Enable SSH for testing only. All IP addresses are allowed because I had trouble getting it to work through a VPN."
  from_port = 22
  to_port = 22
  cidr_ipv4 = "0.0.0.0/0"
}

resource aws_vpc_security_group_egress_rule https_wss_egress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"

  description = "HTTPS and WSS traffic to communicate with frontend and download packages."
  from_port = 443
  to_port = 443
  cidr_ipv4 = "0.0.0.0/0"
}

resource aws_vpc_security_group_egress_rule http_egress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"

  description = "HTTP traffic to download packages."
  from_port = 80
  to_port = 80
  cidr_ipv4 = "0.0.0.0/0"
}

resource aws_vpc_security_group_egress_rule dns_egress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "udp"

  description = "DNS resolution"
  from_port = 53
  to_port = 53
  cidr_ipv4 = "0.0.0.0/0"
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

  vpc_security_group_ids = [aws_security_group.security_group.id]

  monitoring = false

  # Key is manually created.
  key_name = "just-let-me-draw"

  user_data = file("${path.module}/on-deploy.sh")

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
