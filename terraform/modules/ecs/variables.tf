variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for ECS services"
  type        = list(string)
}

variable "alb_target_group_api_arn" {
  description = "ARN of the ALB target group for API"
  type        = string
  default     = null
}

variable "alb_security_group_id" {
  description = "Security group ID of the ALB"
  type        = string
  default     = null
}

variable "database_endpoint" {
  description = "Database endpoint"
  type        = string
}

variable "redis_endpoint" {
  description = "Redis cluster endpoint"
  type        = string
}

variable "redis_auth_token" {
  description = "Redis authentication token"
  type        = string
  sensitive   = true
}

variable "api_repository_url" {
  description = "ECR repository URL for API"
  type        = string
}

variable "web_repository_url" {
  description = "ECR repository URL for frontend web app"
  type        = string
}


# Environment variables
variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "service_tickets"
}

variable "jwt_secret" {
  description = "JWT secret"
  type        = string
  sensitive   = true
}


# Task configuration
variable "api_cpu" {
  description = "CPU units for API task (1024 = 1 vCPU)"
  type        = number
  default     = 2048
}

variable "api_memory" {
  description = "Memory (MB) for API task"
  type        = number
  default     = 4096
}


# Service configuration
variable "api_desired_count" {
  description = "Desired count for API service"
  type        = number
  default     = 1
}


# Auto-scaling configuration
variable "api_min_capacity" {
  description = "Minimum capacity for API service auto-scaling"
  type        = number
  default     = 0
}

variable "api_max_capacity" {
  description = "Maximum capacity for API service auto-scaling"
  type        = number
  default     = 20
}


# Secrets Manager integration
variable "secrets_access_role_arn" {
  description = "ARN of the IAM role for accessing secrets"
  type        = string
  default     = ""
}

variable "db_secret_arn" {
  description = "ARN of the database password secret"
  type        = string
  default     = ""
}

variable "jwt_secret_arn" {
  description = "ARN of the JWT secret"
  type        = string
  default     = ""
}

variable "app_config_secret_arn" {
  description = "ARN of the application configuration secret"
  type        = string
  default     = ""
}


variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "cors_origin" {
  description = "CORS origin URLs (comma-separated for multiple origins)"
  type        = string
  default     = "http://localhost:5173"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
