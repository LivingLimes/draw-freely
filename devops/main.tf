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

resource "aws_vpc" "vpc" {
  cidr_block = "10.0.0.0/16"

  enable_dns_hostnames = true
  enable_dns_support = true

  instance_tenancy = "default"
  
  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.vpc.id

  cidr_block              = "10.0.1.0/24"  
  availability_zone       = "${var.region}a"
  map_public_ip_on_launch = false

  assign_ipv6_address_on_creation = false

  tags = {
    Name = "${local.name_prefix}-subnet"
  }
}

resource "aws_route_table" "route_table" {
  vpc_id = aws_vpc.vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.internet_gateway.id
  }

  tags = {
    Name = "${local.name_prefix}-rt"
  }
}

resource "aws_route_table_association" route_table_association {
  route_table_id = aws_route_table.route_table.id
  subnet_id = aws_subnet.public_subnet.id
}

resource "aws_internet_gateway" internet_gateway {
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

resource aws_security_group security_group {
  vpc_id = aws_vpc.vpc.id

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
  
  iam_instance_profile = aws_iam_instance_profile.certbot_profile.name

  vpc_security_group_ids = [aws_security_group.security_group.id]
  subnet_id = aws_subnet.public_subnet.id

  associate_public_ip_address = false

  monitoring = false

  # Key is manually created.
  key_name = "just-let-me-draw"

  user_data = templatefile("${path.module}/on-deploy.sh", {
    aws_region = "${var.region}",
    domain = "${var.domain}"
  })

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

resource "aws_eip" "web_eip" {
  domain = "vpc"

  tags = {
    Name = "${local.name_prefix}-eip"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_eip_association" "web_eip_association" {
  instance_id = aws_instance.web.id
  allocation_id = aws_eip.web_eip.id
}

resource "aws_route53_zone" "zone" {
  name = var.domain
  force_destroy = false

  tags = {
    Name = "${local.name_prefix}-zone"
  }
}

resource "aws_route53_record" "a_record" {
  zone_id = aws_route53_zone.zone.zone_id
  name    = var.domain
  type    = "A"
  ttl     = 300

  records = [aws_eip.web_eip.public_ip]
}

resource "aws_iam_role" "certbot_role" {
  name = "certbot-dns01-role"

  assume_role_policy = jsonencode({
    "Statement": [{
      "Action": "sts:AssumeRole"
      "Effect": "Allow"
      "Principal": {
        "Service": "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "certbot_policy" {
  name = "certbot-dns01-policy"
  role = aws_iam_role.certbot_role.name

  policy = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "route53:ListHostedZones",
          "route53:GetChange"
        ],
        "Resource": [
          "*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "route53:ChangeResourceRecordSets"
        ],
        "Resource": [
          "arn:aws:route53:::hostedzone/${aws_route53_zone.zone.id}"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "certbot_profile" {
  name = "certbot_profile"
  role = aws_iam_role.certbot_role.name
}

output "nameservers" {
  description = "Nameservers for the Route 53 hosted zone. Configure these in your domain registrar."
  value       = aws_route53_zone.zone.name_servers
}

output "elastic_ip" {
  description = "EC2 elastic ip address"
  value = aws_eip.web_eip.public_ip
}