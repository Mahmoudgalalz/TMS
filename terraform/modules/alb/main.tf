# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = var.security_group_ids
  subnets            = var.subnet_ids

  enable_deletion_protection = var.enable_deletion_protection

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb"
  })
}

# Target Group for API
resource "aws_lb_target_group" "api" {
  name        = "${var.name_prefix}-api-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/v1/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  # Deregistration delay for faster scale-down
  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-target-group"
  })
}

# Target Group for Web Frontend
resource "aws_lb_target_group" "web" {
  name        = "${var.name_prefix}-web-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  # Deregistration delay for faster scale-down
  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-web-target-group"
  })
}

# Target Group for AI Service - commented out as AI service is not deployed
# resource "aws_lb_target_group" "ai_service" {
#   name        = "${var.name_prefix}-ai-service-tg"
#   port        = 3001
#   protocol    = "HTTP"
#   vpc_id      = var.vpc_id
#   target_type = "ip"
#
#   health_check {
#     enabled             = true
#     healthy_threshold   = 2
#     interval            = 30
#     matcher             = "200"
#     path                = "/api/v1/health"
#     port                = "traffic-port"
#     protocol            = "HTTP"
#     timeout             = 5
#     unhealthy_threshold = 2
#   }
#
#   # Deregistration delay for faster scale-down
#   deregistration_delay = 30
#
#   tags = merge(var.tags, {
#     Name = "${var.name_prefix}-ai-service-target-group"
#   })
# }

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-http-listener"
  })
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  count = var.certificate_arn != "" ? 1 : 0
  
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-https-listener"
  })
}

# HTTP Listener (for development without SSL)
resource "aws_lb_listener" "http_dev" {
  count = var.certificate_arn == "" ? 1 : 0
  
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-http-dev-listener"
  })
}

# Listener Rules for API
resource "aws_lb_listener_rule" "api" {
  count = var.certificate_arn != "" ? 1 : 0
  
  listener_arn = aws_lb_listener.https[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health"]
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-listener-rule"
  })
}

# Listener Rules for API (HTTP dev)
resource "aws_lb_listener_rule" "api_dev" {
  count = var.certificate_arn == "" ? 1 : 0
  
  listener_arn = aws_lb_listener.http_dev[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health"]
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-dev-listener-rule"
  })
}

# Listener Rules for AI Service (HTTPS) - commented out as AI service not deployed
# resource "aws_lb_listener_rule" "ai_service" {
#   count = var.certificate_arn != "" ? 1 : 0
#   
#   listener_arn = aws_lb_listener.https[0].arn
#   priority     = 200
#
#   action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.ai_service.arn
#   }
#
#   condition {
#     path_pattern {
#       values = ["/ai/*"]
#     }
#   }
#
#   tags = merge(var.tags, {
#     Name = "${var.name_prefix}-ai-service-listener-rule"
#   })
# }

# Listener Rules for AI Service (HTTP dev) - commented out as AI service not deployed
# resource "aws_lb_listener_rule" "ai_service_dev" {
#   count = var.certificate_arn == "" ? 1 : 0
#   
#   listener_arn = aws_lb_listener.http_dev[0].arn
#   priority     = 200
#
#   action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.ai_service.arn
#   }
#
#   condition {
#     path_pattern {
#       values = ["/ai/*"]
#     }
#   }
#
#   tags = merge(var.tags, {
#     Name = "${var.name_prefix}-ai-service-dev-listener-rule"
#   })
# }

# CloudWatch Alarms for ALB
resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  alarm_name          = "${var.name_prefix}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB target response time"
  alarm_actions       = var.alarm_actions

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb-response-time-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_healthy_host_count" {
  alarm_name          = "${var.name_prefix}-alb-low-healthy-hosts"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB healthy host count"
  alarm_actions       = var.alarm_actions

  dimensions = {
    TargetGroup  = aws_lb_target_group.api.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb-healthy-hosts-alarm"
  })
}
