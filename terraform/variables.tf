variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "service-ticket-system"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_master_username" {
  description = "Master username for the database"
  type        = string
  default     = "postgres"
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "service_tickets_dev"
}

variable "ecr_repositories" {
  description = "List of ECR repositories to create"
  type        = list(string)
  default     = ["api", "web"]
}

variable "min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 0
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "scale_down_cooldown" {
  description = "Cooldown period for scaling down (seconds)"
  type        = number
  default     = 300
}

variable "scale_up_cooldown" {
  description = "Cooldown period for scaling up (seconds)"
  type        = number
  default     = 300
}
