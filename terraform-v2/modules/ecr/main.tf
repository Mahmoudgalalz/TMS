# ECR Repositories
resource "aws_ecr_repository" "repositories" {
  for_each = toset(var.repositories)
  
  name                 = "${var.name_prefix}-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete        = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${each.key}-ecr"
  })
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "repositories" {
  for_each = aws_ecr_repository.repositories

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
