locals {
  managed_by = "terraform"
  name_prefix = "${var.app_name}-${var.environment}"

  port = {
    http = 80
    https = 443
    ssh = 22
    dns = 53
  }

  common_tags = {
    Environment = var.environment
    Service = var.app_name
    ManagedBy = local.managed_by
  }
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

variable vpc_cidr_block {
  type = string
}

provider "aws" {
  region = var.region
}

resource "aws_vpc" vpc {
  cidr_block = var.vpc_cidr_block

  enable_dns_hostnames = true
  enable_dns_support = true

  instance_tenancy     = "default"
  
  tags = merge(local.common_tags, {
    Name        = "${local.name_prefix}-vpc"
  })
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.vpc.id

  cidr_block              = "10.0.1.0/24"  
  availability_zone       = "${var.region}a"
  map_public_ip_on_launch = true

  assign_ipv6_address_on_creation = true

  tags = merge(local.common_tags, {
    Name        = "${local.name_prefix}-subnet"
  })
}

resource "aws_route_table" route_table {
  vpc_id = aws_vpc.vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.internet_gateway.id
  }
}

resource "aws_route_table_association" route_table_association {
  route_table_id = aws_route_table.route_table.id
  subnet_id = aws_subnet.public_subnet.id
}

resource "aws_internet_gateway" internet_gateway {
  vpc_id = aws_vpc.vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource aws_security_group security_group {
  name = "${local.name_prefix}-sg"
  description = "Security group for just-let-me-draw game"
  vpc_id = aws_vpc.vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg"
  })

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
  cidr_ipv4 = "0.0.0.0/0"
}

resource aws_vpc_security_group_ingress_rule http_ingress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"

  description = "HTTP for HTTPS redirect."
  from_port = local.port.http
  to_port = local.port.http
  cidr_ipv4 = "0.0.0.0/0"
}

resource aws_vpc_security_group_ingress_rule ssh_ingress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"

  description = "Enable SSH for testing only. All IP addresses are allowed because I had trouble getting it to work through a VPN."
  from_port = local.port.ssh
  to_port = local.port.ssh
  cidr_ipv4 = "0.0.0.0/0"
}

resource aws_vpc_security_group_egress_rule https_wss_egress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"

  description = "HTTPS and WSS traffic to communicate with frontend and download packages."
  from_port = local.port.https
  to_port = local.port.https
  cidr_ipv4 = "0.0.0.0/0"
}

resource aws_vpc_security_group_egress_rule http_egress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "tcp"

  description = "HTTP traffic to download packages."
  from_port = local.port.http
  to_port = local.port.http
  cidr_ipv4 = "0.0.0.0/0"
}

resource aws_vpc_security_group_egress_rule dns_egress_rule {
  security_group_id = aws_security_group.security_group.id
  ip_protocol = "udp"

  description = "DNS resolution"
  from_port = local.port.dns
  to_port = local.port.dns
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
    tags = merge(local.common_tags, {
      Name        = "${local.name_prefix}-root"
    })
  }

  hibernation                          = false
  disable_api_termination              = var.disable_api_termination
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

  tags = merge(local.common_tags, {
    Name        = local.name_prefix
  })
}
