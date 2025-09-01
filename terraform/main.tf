terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "service-ticket-system-terraform-state-1756564675"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "service-ticket-system-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Secrets Manager
module "secrets" {
  source = "./modules/secrets"
  
  name_prefix = local.name_prefix
  
  # Pass secrets from variables (can be empty for auto-generation)
  db_master_password    = var.db_master_password
  jwt_secret           = var.jwt_secret
  redis_password       = var.redis_password
  smtp_password        = var.smtp_password
  cloudflare_token     = var.cloudflare_token
  cloudflare_account_id = var.cloudflare_account_id
  ai_secret           = var.ai_secret
  encryption_key      = var.encryption_key
  webhook_secret      = var.webhook_secret
  api_key             = var.api_key
  
  tags = local.common_tags
}

# Networking
module "networking" {
  source = "./modules/networking"
  
  name_prefix         = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = data.aws_availability_zones.available.names
  
  tags = local.common_tags
}

# Database
module "database" {
  source = "./modules/database"
  
  name_prefix    = local.name_prefix
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.private_subnet_ids
  security_group_ids = [module.networking.database_security_group_id]
  
  master_username = var.db_master_username
  master_password = module.secrets.db_master_password_value
  database_name   = var.db_name
  
  min_capacity = var.db_min_capacity
  max_capacity = var.db_max_capacity
  auto_pause   = var.db_auto_pause
  
  tags = local.common_tags
}

# Cache
module "cache" {
  source = "./modules/cache"
  
  name_prefix    = local.name_prefix
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.private_subnet_ids
  security_group_ids = [module.networking.cache_security_group_id]
  
  node_type      = var.redis_node_type
  auth_token     = module.secrets.redis_password_value
  
  tags = local.common_tags
}

# ECR Repositories
module "ecr" {
  source = "./modules/ecr"
  
  name_prefix = local.name_prefix
  repositories = ["api", "web"]
  
  tags = local.common_tags
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"
  
  name_prefix = local.name_prefix
  vpc_id      = module.networking.vpc_id
  subnet_ids  = module.networking.private_subnet_ids
  
  # Load balancer configuration - Disabled due to ALB restrictions
  alb_target_group_api_arn = null
  alb_target_group_web_arn = null
  alb_dns_name             = ""
  alb_security_group_id    = module.networking.alb_security_group_id
  
  # Database and cache
  database_endpoint = module.database.cluster_endpoint
  redis_endpoint    = module.cache.redis_endpoint
  redis_auth_token  = module.secrets.redis_password_value
  
  # Repository URLs
  api_repository_url = module.ecr.api_repository_url
  web_repository_url = module.ecr.web_repository_url
  
  # Secrets Manager integration
  secrets_access_role_arn = module.secrets.secrets_access_role_arn
  db_secret_arn          = module.secrets.db_master_password_secret_arn
  jwt_secret_arn         = module.secrets.jwt_secret_arn
  app_config_secret_arn  = module.secrets.app_config_secret_arn
  
  # Fallback JWT secret (will be replaced by secrets manager)
  jwt_secret = ""
  
  # CORS configuration - allow all origins for Fargate frontend
  cors_origin = "*"
  
  tags = local.common_tags
}

# Build artifacts S3 bucket for CI/CD
resource "aws_s3_bucket" "build_artifacts" {
  bucket = "${local.name_prefix}-build-artifacts-${random_string.artifacts_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-build-artifacts-bucket"
  })
}

resource "random_string" "artifacts_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Monitoring
module "monitoring" {
  source = "./modules/monitoring"
  
  name_prefix = local.name_prefix
  
  # ECS resources
  ecs_cluster_name  = module.ecs.cluster_name
  ecs_service_names = module.ecs.service_names
  
  # Database
  database_cluster_identifier = module.database.cluster_identifier
  
  # Load balancer - Disabled due to AWS account limitations
  alb_arn_suffix = null
  
  # Notification email
  notification_email = var.notification_email
  
  tags = local.common_tags
}
