# Load Balancer
# ALB outputs - Commented out due to AWS account limitations
# output "alb_dns_name" {
#   description = "DNS name of the load balancer"
#   value       = module.alb.alb_dns_name
# }

# output "alb_zone_id" {
#   description = "Zone ID of the load balancer"
#   value       = module.alb.alb_zone_id
# }

# Database
output "database_endpoint" {
  description = "Aurora cluster endpoint"
  value       = module.database.cluster_endpoint
  sensitive   = true
}

output "database_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = module.database.cluster_reader_endpoint
  sensitive   = true
}

# Cache
output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.cache.redis_endpoint
  sensitive   = true
}

# ECR Repositories
output "ecr_repositories" {
  description = "ECR repository URLs"
  value = {
    api = module.ecr.api_repository_url
    web = module.ecr.web_repository_url
  }
}

# S3 Frontend
output "frontend_bucket_name" {
  description = "S3 bucket name for frontend hosting"
  value       = module.s3_frontend.bucket_name
}

# Frontend - CloudFront outputs commented out due to AWS account limitations
# output "frontend_cloudfront_domain" {
#   description = "CloudFront distribution domain name"
#   value       = module.s3_frontend.cloudfront_domain_name
# }

# ECS
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_names" {
  description = "ECS service names"
  value       = module.ecs.service_names
}

# CI/CD
output "codebuild_project_names" {
  description = "CodeBuild project names"
  value       = module.codebuild.project_names
}

output "codepipeline_name" {
  description = "CodePipeline name"
  value       = module.codebuild.pipeline_name
}

# Monitoring
output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.dashboard_url
}
