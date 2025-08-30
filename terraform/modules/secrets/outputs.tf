# Outputs for Secrets Manager Module

output "db_master_password_secret_arn" {
  description = "ARN of the database master password secret"
  value       = aws_secretsmanager_secret.db_master_password.arn
}

output "db_master_password_secret_name" {
  description = "Name of the database master password secret"
  value       = aws_secretsmanager_secret.db_master_password.name
}

output "jwt_secret_arn" {
  description = "ARN of the JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "jwt_secret_name" {
  description = "Name of the JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.name
}

output "app_config_secret_arn" {
  description = "ARN of the application configuration secret"
  value       = aws_secretsmanager_secret.app_config.arn
}

output "app_config_secret_name" {
  description = "Name of the application configuration secret"
  value       = aws_secretsmanager_secret.app_config.name
}

output "secrets_access_role_arn" {
  description = "ARN of the IAM role for accessing secrets"
  value       = aws_iam_role.secrets_access.arn
}

output "secrets_access_role_name" {
  description = "Name of the IAM role for accessing secrets"
  value       = aws_iam_role.secrets_access.name
}

# Secret values for use in other modules (marked as sensitive)
output "db_master_password_value" {
  description = "Database master password value"
  value       = var.db_master_password != "" ? var.db_master_password : random_password.db_master_password[0].result
  sensitive   = true
}

output "jwt_secret_value" {
  description = "JWT secret value"
  value       = var.jwt_secret != "" ? var.jwt_secret : random_password.jwt_secret[0].result
  sensitive   = true
}

output "redis_password_value" {
  description = "Redis password value"
  value       = var.redis_password != "" ? var.redis_password : random_password.redis_password[0].result
  sensitive   = true
}
