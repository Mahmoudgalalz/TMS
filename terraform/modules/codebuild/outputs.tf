output "project_names" {
  description = "CodeBuild project names"
  value = {
    api        = aws_codebuild_project.api.name
    ai_service = aws_codebuild_project.ai_service.name
    frontend   = aws_codebuild_project.frontend.name
  }
}

output "project_arns" {
  description = "CodeBuild project ARNs"
  value = {
    api        = aws_codebuild_project.api.arn
    ai_service = aws_codebuild_project.ai_service.arn
    frontend   = aws_codebuild_project.frontend.arn
  }
}

output "pipeline_name" {
  description = "CodePipeline name"
  value       = aws_codepipeline.main.name
}

output "pipeline_arn" {
  description = "CodePipeline ARN"
  value       = aws_codepipeline.main.arn
}

output "codebuild_role_arn" {
  description = "CodeBuild IAM role ARN"
  value       = aws_iam_role.codebuild.arn
}

output "codepipeline_role_arn" {
  description = "CodePipeline IAM role ARN"
  value       = aws_iam_role.codepipeline.arn
}
