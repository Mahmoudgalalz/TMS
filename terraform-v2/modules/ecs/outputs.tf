output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "service_names" {
  description = "Map of service names"
  value = {
    api      = aws_ecs_service.api.name
    frontend = aws_ecs_service.frontend.name
  }
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer (not available - ALB restricted)"
  value       = "not-available-alb-restricted"
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer (not available - ALB restricted)"
  value       = "not-available-alb-restricted"
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer (not available - ALB restricted)"
  value       = "not-available-alb-restricted"
}
