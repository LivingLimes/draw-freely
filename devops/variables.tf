variable "environment" {
  type = string
}

variable "app_name" {
  type    = string
  default = "just-let-me-draw"
}

variable "region" {
  type    = string
  default = "ap-southeast-2"
}

variable "allowed_ssh_cidrs" {
  type = string
  default = "CIDR blocks for SSH access to EC2"
}

variable "disable_api_termination" {
  type = bool
  default = true
  description = "Disable api termination for ec2 instances."
}