output "cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_identifier" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.main.port
}

output "database_name" {
  description = "Name of the database"
  value       = aws_rds_cluster.main.database_name
}
