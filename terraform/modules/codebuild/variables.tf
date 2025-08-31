variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "api_repository_url" {
  description = "ECR repository URL for API"
  type        = string
}

variable "web_repository_url" {
  description = "ECR repository URL for web"
  type        = string
}


variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "ecs_service_names" {
  description = "ECS service names"
  type = object({
    api = string
  })
}

variable "frontend_bucket_name" {
  description = "S3 bucket name for frontend"
  type        = string
}

variable "frontend_bucket_arn" {
  description = "S3 bucket ARN for frontend"
  type        = string
}

variable "build_artifacts_bucket_name" {
  description = "S3 bucket name for build artifacts"
  type        = string
}

variable "build_artifacts_bucket_arn" {
  description = "S3 bucket ARN for build artifacts"
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  type        = string
  default     = null
}

variable "github_connection_arn" {
  description = "GitHub connection ARN for CodeStar"
  type        = string
  default     = ""
}

variable "github_repository" {
  description = "GitHub repository in format owner/repo"
  type        = string
  default     = ""
}

variable "github_branch" {
  description = "GitHub branch to use"
  type        = string
  default     = "main"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
