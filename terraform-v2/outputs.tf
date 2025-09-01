output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.ecs.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = module.ecs.alb_zone_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_names" {
  description = "Names of the ECS services"
  value       = module.ecs.service_names
}

output "ecr_repositories" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "database_endpoint" {
  description = "Aurora cluster endpoint"
  value       = module.database.cluster_endpoint
  sensitive   = true
}

output "cache_endpoint" {
  description = "ElastiCache endpoint"
  value       = module.cache.endpoint
  sensitive   = true
}

output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = module.secrets.secrets_manager_arn
  sensitive   = true
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = module.monitoring.dashboard_url
}

output "frontend_url" {
  description = "URL to access the frontend application"
  value       = "http://${module.ecs.alb_dns_name}"
}

output "api_url" {
  description = "URL to access the API"
  value       = "http://${module.ecs.alb_dns_name}/api/v1"
}
