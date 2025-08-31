output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "service_names" {
  description = "ECS service names"
  value = {
    api      = aws_ecs_service.api.name
    frontend = aws_ecs_service.frontend.name
  }
}

output "task_definition_arns" {
  description = "ECS task definition ARNs"
  value = {
    api      = aws_ecs_task_definition.api.arn
    frontend = aws_ecs_task_definition.frontend.arn
  }
}

output "service_discovery_namespace_id" {
  description = "Service discovery namespace ID"
  value       = aws_service_discovery_private_dns_namespace.main.id
}

output "ecs_security_group_id" {
  description = "ECS tasks security group ID"
  value       = aws_security_group.ecs_tasks.id
}
