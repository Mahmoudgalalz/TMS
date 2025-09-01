# Data sources
data "aws_region" "current" {}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs.name
      }
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-cluster"
  })
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.name_prefix}"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-logs"
  })
}

# Note: ALB creation is restricted in this AWS account
# Services will be accessed directly via public IPs

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.name_prefix}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-task-execution-role"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Policy for Secrets Manager access
resource "aws_iam_role_policy" "ecs_secrets" {
  name = "${var.name_prefix}-ecs-secrets-policy"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [var.secrets_arn]
      }
    ]
  })
}

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task" {
  name = "${var.name_prefix}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-task-role"
  })
}

# ECS Task Definitions
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.name_prefix}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "${var.ecr_repositories["api"]}:latest"
      
      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3001"
        },
        {
          name  = "DB_HOST"
          value = var.database_endpoint
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = var.database_name
        },
        {
          name  = "DB_USERNAME"
          value = var.database_username
        },
        {
          name  = "REDIS_HOST"
          value = var.cache_endpoint
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        }
      ]
      
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = "${var.secrets_arn}:DB_PASSWORD::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${var.secrets_arn}:JWT_SECRET::"
        },
        {
          name      = "JWT_REFRESH_SECRET"
          valueFrom = "${var.secrets_arn}:JWT_REFRESH_SECRET::"
        },
        {
          name      = "CLOUDFLARE_API_TOKEN"
          valueFrom = "${var.secrets_arn}:CLOUDFLARE_API_TOKEN::"
        },
        {
          name      = "CLOUDFLARE_ZONE_ID"
          valueFrom = "${var.secrets_arn}:CLOUDFLARE_ZONE_ID::"
        },
        {
          name      = "SMTP_HOST"
          valueFrom = "${var.secrets_arn}:SMTP_HOST::"
        },
        {
          name      = "SMTP_PORT"
          valueFrom = "${var.secrets_arn}:SMTP_PORT::"
        },
        {
          name      = "SMTP_USER"
          valueFrom = "${var.secrets_arn}:SMTP_USER::"
        },
        {
          name      = "SMTP_PASS"
          valueFrom = "${var.secrets_arn}:SMTP_PASS::"
        },
        {
          name      = "SMTP_FROM"
          valueFrom = "${var.secrets_arn}:SMTP_FROM::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "api"
        }
      }
      
      essential = true
    }
  ])

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-task-definition"
  })
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.name_prefix}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${var.ecr_repositories["web"]}:latest"
      
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "VITE_API_URL"
          value = "http://localhost:3001/api/v1"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "frontend"
        }
      }
      
      essential = true
    }
  ])

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-frontend-task-definition"
  })
}

# ECS Services
resource "aws_ecs_service" "api" {
  name            = "${var.name_prefix}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 0  # Start with 0 for scale-to-zero
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [var.ecs_security_group_id]
    subnets          = var.public_subnet_ids
    assign_public_ip = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-service"
  })
}

resource "aws_ecs_service" "frontend" {
  name            = "${var.name_prefix}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 0  # Start with 0 for scale-to-zero
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [var.ecs_security_group_id]
    subnets          = var.public_subnet_ids
    assign_public_ip = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-frontend-service"
  })
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "api" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-autoscaling-target"
  })
}

resource "aws_appautoscaling_target" "frontend" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.frontend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-frontend-autoscaling-target"
  })
}

# Auto Scaling Policies
resource "aws_appautoscaling_policy" "api_up" {
  name               = "${var.name_prefix}-api-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.target_cpu_utilization
    scale_in_cooldown  = var.scale_down_cooldown
    scale_out_cooldown = var.scale_up_cooldown
  }
}

resource "aws_appautoscaling_policy" "frontend_up" {
  name               = "${var.name_prefix}-frontend-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.target_cpu_utilization
    scale_in_cooldown  = var.scale_down_cooldown
    scale_out_cooldown = var.scale_up_cooldown
  }
}
