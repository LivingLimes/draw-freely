variable "environment" {
  type = string
}

variable "app_name" {
  type    = string
  default = "draw-freely"
}

variable cost_center {
  type = string
  default = "for-fun"
}

variable "region" {
  type    = string
  default = "ap-southeast-2"
}

variable "instance_type" {
  type = string
}

variable "disable_api_termination" {
  type        = bool
  default     = true
  description = "Disable api termination for ec2 instances."
}

variable "enable_ssh_access" {
  type = bool
  default = false
  description = "Whether to enable SSH access for ec2 instances"
}

variable "domain" {
  type = string
  description = "EC2 instance domain name"
}
