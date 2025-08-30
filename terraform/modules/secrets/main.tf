# AWS Secrets Manager for Application Secrets

# Database Master Password Secret
resource "aws_secretsmanager_secret" "db_master_password" {
  name                    = "${var.name_prefix}-db-master-password"
  description             = "Database master password for ${var.name_prefix}"
  recovery_window_in_days = var.recovery_window_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-master-password"
    Type = "Database"
  })
}

resource "aws_secretsmanager_secret_version" "db_master_password" {
  secret_id     = aws_secretsmanager_secret.db_master_password.id
  secret_string = var.db_master_password
}

# JWT Secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.name_prefix}-jwt-secret"
  description             = "JWT signing secret for ${var.name_prefix}"
  recovery_window_in_days = var.recovery_window_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-jwt-secret"
    Type = "Application"
  })
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

# Application Configuration Secret (JSON format for multiple values)
resource "aws_secretsmanager_secret" "app_config" {
  name                    = "${var.name_prefix}-app-config"
  description             = "Application configuration secrets for ${var.name_prefix}"
  recovery_window_in_days = var.recovery_window_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-app-config"
    Type = "Application"
  })
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    REDIS_PASSWORD     = var.redis_password
    SMTP_PASSWORD      = var.smtp_password
    CLOUDFLARE_TOKEN   = var.cloudflare_token
    ENCRYPTION_KEY     = var.encryption_key
    WEBHOOK_SECRET     = var.webhook_secret
    API_KEY            = var.api_key
  })
}

# IAM Role for ECS Tasks to Access Secrets
resource "aws_iam_role" "secrets_access" {
  name = "${var.name_prefix}-secrets-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-secrets-access-role"
  })
}

# IAM Policy for Secrets Access
resource "aws_iam_policy" "secrets_access" {
  name        = "${var.name_prefix}-secrets-access-policy"
  description = "Policy to allow ECS tasks to access secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_master_password.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.app_config.arn
        ]
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-secrets-access-policy"
  })
}

# Attach Policy to Role
resource "aws_iam_role_policy_attachment" "secrets_access" {
  role       = aws_iam_role.secrets_access.name
  policy_arn = aws_iam_policy.secrets_access.arn
}

# Random password generation for secrets that aren't provided
resource "random_password" "db_master_password" {
  count   = var.db_master_password == "" ? 1 : 0
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  count   = var.jwt_secret == "" ? 1 : 0
  length  = 64
  special = false
}

resource "random_password" "redis_password" {
  count   = var.redis_password == "" ? 1 : 0
  length  = 32
  special = true
}

resource "random_password" "encryption_key" {
  count   = var.encryption_key == "" ? 1 : 0
  length  = 32
  special = false
}
