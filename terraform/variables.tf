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
  default     = ""
}

variable "redis_password" {
  description = "Redis password (leave empty for auto-generation)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "smtp_password" {
  description = "SMTP password for email notifications"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "encryption_key" {
  description = "Application encryption key (leave empty for auto-generation)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "webhook_secret" {
  description = "Webhook secret for external integrations"
  type        = string
  sensitive   = true
  default     = ""
}

variable "api_key" {
  description = "General API key for external services"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ai_secret" {
  description = "AI service secret key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cors_origin" {
  description = "CORS origin URLs (comma-separated for multiple origins)"
  type        = string
  default     = "http://localhost:5173"
}

# Monitoring
variable "notification_email" {
  description = "Email for monitoring notifications"
  type        = string
}
