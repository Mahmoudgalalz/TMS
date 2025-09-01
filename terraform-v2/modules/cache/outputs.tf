output "endpoint" {
  description = "ElastiCache serverless endpoint"
  value       = aws_elasticache_serverless_cache.main.endpoint[0].address
}

output "port" {
  description = "ElastiCache serverless port"
  value       = aws_elasticache_serverless_cache.main.endpoint[0].port
}

output "cache_name" {
  description = "Name of the ElastiCache serverless cache"
  value       = aws_elasticache_serverless_cache.main.name
}
