# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.name_prefix}-cache-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-cache-subnet-group"
  })
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  family = "redis7"
  name   = "${var.name_prefix}-redis-params"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-redis-parameter-group"
  })
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "main" {
  replication_group_id         = "${var.name_prefix}-redis"
  description                  = "Redis cluster for ${var.name_prefix}"
  
  # Node configuration
  node_type                    = var.node_type
  port                        = 6379
  parameter_group_name        = aws_elasticache_parameter_group.main.name
  
  # Cluster configuration
  num_cache_clusters          = var.num_cache_nodes
  
  # Network configuration
  subnet_group_name           = aws_elasticache_subnet_group.main.name
  security_group_ids          = var.security_group_ids
  
  # Security
  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = false
  # auth_token only works with transit encryption enabled
  
  # Backup configuration
  snapshot_retention_limit    = var.snapshot_retention_limit
  snapshot_window            = "03:00-05:00"
  maintenance_window         = "sun:05:00-sun:07:00"
  
  # Auto failover
  automatic_failover_enabled = var.num_cache_nodes > 1
  multi_az_enabled          = var.num_cache_nodes > 1
  
  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format      = "text"
    log_type        = "slow-log"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-redis-cluster"
  })

  depends_on = [
    aws_cloudwatch_log_group.redis_slow
  ]
}

# CloudWatch Log Groups for Redis
resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/redis/${var.name_prefix}/slow-log"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-redis-slow-log"
  })
}

# Auto Scaling for Redis (if using cluster mode)
resource "aws_appautoscaling_target" "redis" {
  count = var.enable_auto_scaling ? 1 : 0
  
  max_capacity       = var.max_replicas
  min_capacity       = var.min_replicas
  resource_id        = "replication-group/${aws_elasticache_replication_group.main.replication_group_id}"
  scalable_dimension = "elasticache:replication-group:Replicas"
  service_namespace  = "elasticache"
}

resource "aws_appautoscaling_policy" "redis_scale_up" {
  count = var.enable_auto_scaling ? 1 : 0
  
  name               = "${var.name_prefix}-redis-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.redis[0].resource_id
  scalable_dimension = aws_appautoscaling_target.redis[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.redis[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ElastiCachePrimaryEngineCPUUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_appautoscaling_policy" "redis_scale_down" {
  count = var.enable_auto_scaling ? 1 : 0
  
  name               = "${var.name_prefix}-redis-scale-down"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.redis[0].resource_id
  scalable_dimension = aws_appautoscaling_target.redis[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.redis[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ElastiCachePrimaryEngineCPUUtilization"
    }
    target_value       = 30.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}
