output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "secrets_manager_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.name
}

output "db_master_password" {
  description = "Generated database master password"
  value       = random_password.db_master_password.result
  sensitive   = true
}
