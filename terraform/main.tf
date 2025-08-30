terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
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
  db_master_password = var.db_master_password
  jwt_secret        = var.jwt_secret
  redis_password    = var.redis_password
  smtp_password     = var.smtp_password
  cloudflare_token  = var.cloudflare_token
  encryption_key    = var.encryption_key
  webhook_secret    = var.webhook_secret
  api_key          = var.api_key
  
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

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  name_prefix = local.name_prefix
  vpc_id      = module.networking.vpc_id
  subnet_ids  = module.networking.public_subnet_ids
  security_group_ids = [module.networking.alb_security_group_id]
  
  tags = local.common_tags
}

# S3 for Frontend
module "s3_frontend" {
  source = "./modules/s3"
  
  name_prefix = local.name_prefix
  domain_name = var.domain_name
  
  tags = local.common_tags
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"
  
  name_prefix = local.name_prefix
  vpc_id      = module.networking.vpc_id
  subnet_ids  = module.networking.private_subnet_ids
  
  # Load balancer
  alb_target_group_api_arn = module.alb.api_target_group_arn
  alb_security_group_id    = module.networking.alb_security_group_id
  
  # Database and cache
  database_endpoint = module.database.cluster_endpoint
  redis_endpoint    = module.cache.redis_endpoint
  
  # ECR repositories
  api_repository_url = module.ecr.api_repository_url
  
  # Secrets Manager integration
  secrets_access_role_arn = module.secrets.secrets_access_role_arn
  db_secret_arn          = module.secrets.db_master_password_secret_arn
  jwt_secret_arn         = module.secrets.jwt_secret_arn
  app_config_secret_arn  = module.secrets.app_config_secret_arn
  
  # Fallback JWT secret (will be replaced by secrets manager)
  jwt_secret = ""
  
  tags = local.common_tags
}

# CI/CD Pipeline
module "codebuild" {
  source = "./modules/codebuild"
  
  name_prefix = local.name_prefix
  
  # Repository URLs
  api_repository_url = module.ecr.api_repository_url
  web_repository_url = module.ecr.web_repository_url
  
  # ECS configuration
  ecs_cluster_name  = module.ecs.cluster_name
  ecs_service_names = module.ecs.service_names
  
  # S3 frontend bucket
  frontend_bucket_name = module.s3_frontend.bucket_name
  frontend_bucket_arn = module.s3_frontend.bucket_arn
  build_artifacts_bucket_name = module.s3_frontend.build_artifacts_bucket_name
  build_artifacts_bucket_arn = module.s3_frontend.build_artifacts_bucket_arn
  cloudfront_distribution_id = module.s3_frontend.cloudfront_distribution_id
  
  tags = local.common_tags
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
  
  # Load balancer
  alb_arn_suffix = module.alb.alb_arn_suffix
  
  # Notification email
  notification_email = var.notification_email
  
  tags = local.common_tags
}
