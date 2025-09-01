# Random password for database
resource "random_password" "db_master_password" {
  length  = 32
  special = true
}

# Secrets Manager Secret
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.name_prefix}-app-secrets"
  description             = "Application secrets for ${var.name_prefix}"
  recovery_window_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-app-secrets"
  })
}

# Secrets Manager Secret Version
resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    DB_HOST     = ""  # Will be populated after database creation
    DB_PORT     = "5432"
    DB_NAME     = ""  # Will be populated after database creation
    DB_USERNAME = ""  # Will be populated after database creation
    DB_PASSWORD = random_password.db_master_password.result
    REDIS_URL   = ""  # Will be populated after cache creation
    JWT_SECRET  = random_password.jwt_secret.result
    JWT_REFRESH_SECRET = random_password.jwt_refresh_secret.result
    CLOUDFLARE_API_TOKEN = ""  # To be manually set
    CLOUDFLARE_ZONE_ID = ""    # To be manually set
    SMTP_HOST = ""             # To be manually set
    SMTP_PORT = "587"
    SMTP_USER = ""             # To be manually set
    SMTP_PASS = ""             # To be manually set
    SMTP_FROM = ""             # To be manually set
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Additional random passwords
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = true
}
