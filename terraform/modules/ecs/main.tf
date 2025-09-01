# Data sources
data "aws_region" "current" {}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
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

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.name_prefix}/api"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-logs"
  })
}

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

# Additional policy for Secrets Manager access
resource "aws_iam_role_policy" "ecs_secrets_access" {
  name  = "${var.name_prefix}-ecs-secrets-access"
  role  = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = compact([
          var.db_secret_arn,
          var.jwt_secret_arn,
          var.app_config_secret_arn
        ])
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

# IAM Policy for ECS Tasks (access to secrets, S3, etc.)
resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.name_prefix}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "*"
      }
    ]
  })
}

# API Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.name_prefix}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "${var.api_repository_url}:latest"
      
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
          name  = "DB_USERNAME"
          value = "postgres"
        },
        {
          name  = "DB_NAME"
          value = "service_tickets_dev"
        },
        {
          name  = "REDIS_HOST"
          value = var.redis_endpoint
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        },
        {
          name  = "CORS_ORIGIN"
          value = var.alb_dns_name != "" ? "http://${var.alb_dns_name}" : var.cors_origin
        },
        {
          name  = "JWT_EXPIRES_IN"
          value = "24h"
        },
        {
          name  = "LOG_LEVEL"
          value = "info"
        },
        {
          name  = "CLOUDFLARE_ACCOUNT_ID"
          value = ""
        },
        {
          name  = "CLOUDFLARE_API_TOKEN"
          value = ""
        },
        {
          name  = "AI_SECRET"
          value = ""
        },
        {
          name  = "QUEUE_REDIS_URL"
          value = "redis://:${var.redis_auth_token}@${var.redis_endpoint}:6379"
        }
      ]

      secrets = concat(
        var.db_secret_arn != "" ? [
          {
            name      = "DB_PASSWORD"
            valueFrom = var.db_secret_arn
          }
        ] : [],
        var.jwt_secret_arn != "" ? [
          {
            name      = "JWT_SECRET"
            valueFrom = var.jwt_secret_arn
          }
        ] : [],
        var.app_config_secret_arn != "" ? [
          {
            name      = "APP_CONFIG"
            valueFrom = var.app_config_secret_arn
          }
        ] : []
      )

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.api.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3001/api/v1/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-task-definition"
  })
}


# API ECS Service
resource "aws_ecs_service" "api" {
  name            = "${var.name_prefix}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  # Auto-scaling to zero configuration
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 0

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  dynamic "load_balancer" {
    for_each = var.alb_target_group_api_arn != null ? [1] : []
    content {
      target_group_arn = var.alb_target_group_api_arn
      container_name   = "api"
      container_port   = 3000
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-service"
  })
}


# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.name_prefix}-ecs-tasks-"
  vpc_id      = var.vpc_id

  # HTTP access for frontend
  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # API access
  ingress {
    description = "API from Internet"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.alb_security_group_id != null ? [1] : []
    content {
      description     = "HTTP from ALB"
      from_port       = 3000
      to_port         = 3000
      protocol        = "tcp"
      security_groups = [var.alb_security_group_id]
    }
  }

  ingress {
    description = "Internal communication"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-tasks-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Service Discovery
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "${var.name_prefix}.local"
  description = "Private DNS namespace for ${var.name_prefix}"
  vpc         = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-service-discovery-namespace"
  })
}

# Auto Scaling for API Service
resource "aws_appautoscaling_target" "api" {
  max_capacity       = var.api_max_capacity
  min_capacity       = var.api_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_scale_up" {
  name               = "${var.name_prefix}-api-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}


# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.name_prefix}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "2048"
  memory                   = "4096"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${var.web_repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "VITE_API_URL"
          value = var.alb_dns_name != "" ? "http://${var.alb_dns_name}/api/v1" : "http://localhost:3001/api/v1"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.frontend.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:80 || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      essential = true
    }
  ])

  depends_on = [aws_iam_role_policy_attachment.ecs_task_execution]
}

# Frontend Service
resource "aws_ecs_service" "frontend" {
  name            = "${var.name_prefix}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  dynamic "load_balancer" {
    for_each = var.alb_target_group_web_arn != null ? [1] : []
    content {
      target_group_arn = var.alb_target_group_web_arn
      container_name   = "frontend"
      container_port   = 80
    }
  }

  depends_on = [aws_ecs_task_definition.frontend]
}

# CloudWatch Log Group for Frontend
resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.name_prefix}/frontend"
  retention_in_days = 7

  tags = var.tags
}

