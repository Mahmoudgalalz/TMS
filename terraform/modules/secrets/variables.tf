# Variables for Secrets Manager Module

variable "name_prefix" {
  description = "Prefix for naming resources"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "recovery_window_days" {
  description = "Number of days to retain deleted secrets"
  type        = number
  default     = 7
}

# Database Secrets
variable "db_master_password" {
  description = "Database master password (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

# Application Secrets
variable "jwt_secret" {
  description = "JWT signing secret (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "redis_password" {
  description = "Redis password (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "smtp_password" {
  description = "SMTP password for email notifications"
  type        = string
  default     = ""
  sensitive   = true
}

variable "cloudflare_token" {
  description = "Cloudflare API token"
  type        = string
  default     = ""
  sensitive   = true
}

variable "encryption_key" {
  description = "Application encryption key (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "webhook_secret" {
  description = "Webhook secret for external integrations"
  type        = string
  default     = ""
  sensitive   = true
}

variable "api_key" {
  description = "General API key for external services"
  type        = string
  default     = ""
  sensitive   = true
}
