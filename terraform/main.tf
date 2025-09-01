terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
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

# Modules
module "networking" {
  source = "./modules/networking"
  
  name_prefix         = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
  
  tags = local.common_tags
}

module "secrets" {
  source = "./modules/secrets"
  
  name_prefix = local.name_prefix
  
  tags = local.common_tags
}

module "database" {
  source = "./modules/database"
  
  name_prefix    = local.name_prefix
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.private_subnet_ids
  security_group_ids = [module.networking.database_security_group_id]
  
  master_username = var.db_master_username
  master_password = module.secrets.db_master_password
  database_name   = var.db_name
  
  tags = local.common_tags
}

module "cache" {
  source = "./modules/cache"
  
  name_prefix    = local.name_prefix
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.private_subnet_ids
  security_group_ids = [module.networking.cache_security_group_id]
  
  tags = local.common_tags
}

module "ecr" {
  source = "./modules/ecr"
  
  name_prefix   = local.name_prefix
  repositories  = var.ecr_repositories
  
  tags = local.common_tags
}

module "ecs" {
  source = "./modules/ecs"
  
  name_prefix = local.name_prefix
  vpc_id      = module.networking.vpc_id
  
  public_subnet_ids  = module.networking.public_subnet_ids
  private_subnet_ids = module.networking.private_subnet_ids
  
  alb_security_group_id = module.networking.alb_security_group_id
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  ecr_repositories = module.ecr.repository_urls
  
  # Database connection
  database_endpoint = module.database.cluster_endpoint
  database_name     = var.db_name
  database_username = var.db_master_username
  database_password = module.secrets.db_master_password
  
  # Cache connection
  cache_endpoint = module.cache.endpoint
  
  # Secrets
  secrets_arn = module.secrets.secrets_manager_arn
  
  tags = local.common_tags
}

module "monitoring" {
  source = "./modules/monitoring"
  
  name_prefix      = local.name_prefix
  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_names = module.ecs.service_names
  
  tags = local.common_tags
}
