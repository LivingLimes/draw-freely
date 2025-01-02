locals {
  managed_by  = "terraform"
  name_prefix = "${var.app_name}-${var.environment}"

  port = {
    http = 80
    https = 443
    ssh = 22
    dns = 53
  }

  ipv4_all_ips = "0.0.0.0/0"
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

resource aws_security_group security_group {
  name = "${var.app_name}-${var.environment}-sg"
  description = "Security group for just-let-me-draw game"
  
  tags = {
    Name = "${var.app_name}-${var.environment}-sg"
  }

  lifecycle {
    create_before_destroy = false
  }
}

resource aws_vpc_security_group_ingress_rule https_wss_ingress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"
  description = "HTTPS and WSS traffic."
  from_port = local.port.https
  to_port = local.port.https
  cidr_ipv4 = local.ipv4_all_ips
}

resource aws_vpc_security_group_ingress_rule http_ingress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"
  description = "HTTP for HTTPS redirect."
  from_port = local.port.http
  to_port = local.port.http
  cidr_ipv4 = local.ipv4_all_ips
}

resource aws_vpc_security_group_ingress_rule ssh_ingress_rule {
  count = var.enable_ssh_access ? 1 : 0

  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"

  description = "Enable SSH for testing only. All IP addresses are allowed because I had trouble getting it to work through a VPN."
  from_port = local.port.ssh
  to_port = local.port.ssh
  cidr_ipv4 = local.ipv4_all_ips
}

resource aws_vpc_security_group_egress_rule https_wss_egress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"
  description = "HTTPS and WSS traffic to communicate with frontend and download packages."
  from_port = local.port.https
  to_port = local.port.https
  cidr_ipv4 = local.ipv4_all_ips
}

resource aws_vpc_security_group_egress_rule http_egress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"
  description = "HTTP traffic to download packages."
  from_port = local.port.http
  to_port = local.port.http
  cidr_ipv4 = local.ipv4_all_ips
}

resource aws_vpc_security_group_egress_rule dns_egress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "udp"
  description = "DNS resolution"
  from_port = local.port.dns
  to_port = local.port.dns
  cidr_ipv4 = local.ipv4_all_ips
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

  vpc_security_group_ids = [aws_security_group.security_group.id]

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