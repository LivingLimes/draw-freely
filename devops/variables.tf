variable "environment" {
  type = string
}

variable "app_name" {
  type    = string
  default = "just-let-me-draw"
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