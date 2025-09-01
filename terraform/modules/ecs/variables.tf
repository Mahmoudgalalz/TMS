variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID for the ALB"
  type        = string
}

variable "ecs_security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "ecr_repositories" {
  description = "Map of ECR repository URLs"
  type        = map(string)
}

variable "database_endpoint" {
  description = "Database endpoint"
  type        = string
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "database_username" {
  description = "Database username"
  type        = string
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "cache_endpoint" {
  description = "Cache endpoint"
  type        = string
}

variable "secrets_arn" {
  description = "ARN of the Secrets Manager secret"
  type        = string
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

variable "api_eip_allocation_id" {
  description = "Allocation ID for API Elastic IP"
  type        = string
  default     = ""
}

variable "web_eip_allocation_id" {
  description = "Allocation ID for Web Elastic IP"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
