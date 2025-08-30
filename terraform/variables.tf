# General Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "service-ticket-system"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

# Networking
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Database Configuration
variable "db_master_username" {
  description = "Master username for the database"
  type        = string
  default     = "postgres"
}

variable "db_master_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "service_tickets"
}

variable "db_min_capacity" {
  description = "Minimum Aurora capacity units"
  type        = number
  default     = 0.5
}

variable "db_max_capacity" {
  description = "Maximum Aurora capacity units"
  type        = number
  default     = 16
}

variable "db_auto_pause" {
  description = "Enable auto-pause for Aurora Serverless"
  type        = bool
  default     = true
}

# Cache Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

# Application Configuration
variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID for AI service"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token for AI service"
  type        = string
  sensitive   = true
}

variable "ai_secret" {
  description = "AI service secret"
  type        = string
  sensitive   = true
}

# Monitoring
variable "notification_email" {
  description = "Email for monitoring notifications"
  type        = string
}
