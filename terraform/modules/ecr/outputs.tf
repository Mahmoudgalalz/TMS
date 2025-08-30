output "repository_urls" {
  description = "Map of repository names to URLs"
  value = {
    for name, repo in aws_ecr_repository.repositories : name => repo.repository_url
  }
}

output "api_repository_url" {
  description = "API repository URL"
  value       = aws_ecr_repository.repositories["api"].repository_url
}

output "web_repository_url" {
  description = "Web repository URL"
  value       = aws_ecr_repository.repositories["web"].repository_url
}


output "repository_arns" {
  description = "Map of repository names to ARNs"
  value = {
    for name, repo in aws_ecr_repository.repositories : name => repo.arn
  }
}

output "ecr_access_role_arn" {
  description = "ARN of the ECR access role"
  value       = aws_iam_role.ecr_access.arn
}
