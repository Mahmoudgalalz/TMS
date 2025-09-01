# Network Load Balancer for persistent IPs
resource "aws_lb" "api_nlb" {
  name               = "${var.name_prefix}-api-nlb"
  internal           = false
  load_balancer_type = "network"
  
  subnet_mapping {
    subnet_id     = var.public_subnet_ids[0]
    allocation_id = var.api_eip_allocation_id
  }
  
  subnet_mapping {
    subnet_id     = var.public_subnet_ids[1]
    allocation_id = var.web_eip_allocation_id
  }
  
  enable_deletion_protection = false
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-nlb"
  })
}

resource "aws_lb" "web_nlb" {
  name               = "${var.name_prefix}-web-nlb"
  internal           = false
  load_balancer_type = "network"
  
  subnet_mapping {
    subnet_id     = var.public_subnet_ids[0]
    allocation_id = var.web_eip_allocation_id
  }
  
  enable_deletion_protection = false
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-web-nlb"
  })
}

# Target groups
resource "aws_lb_target_group" "api_tg" {
  name        = "${var.name_prefix}-api-tg"
  port        = 3001
  protocol    = "TCP"
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
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-tg"
  })
}

resource "aws_lb_target_group" "web_tg" {
  name        = "${var.name_prefix}-web-tg"
  port        = 80
  protocol    = "TCP"
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
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-web-tg"
  })
}

# Listeners
resource "aws_lb_listener" "api_listener" {
  load_balancer_arn = aws_lb.api_nlb.arn
  port              = "3001"
  protocol          = "TCP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }
}

resource "aws_lb_listener" "web_listener" {
  load_balancer_arn = aws_lb.web_nlb.arn
  port              = "80"
  protocol          = "TCP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_tg.arn
  }
}
