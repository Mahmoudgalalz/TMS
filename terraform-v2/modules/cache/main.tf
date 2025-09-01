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

# ElastiCache Serverless Cache
resource "aws_elasticache_serverless_cache" "main" {
  engine = "redis"
  name   = "${var.name_prefix}-redis"
  
  cache_usage_limits {
    data_storage {
      maximum = 1
      unit    = "GB"
    }
    ecpu_per_second {
      maximum = 1000
    }
  }
  
  daily_snapshot_time      = "09:00"
  description             = "Serverless Redis cache for ${var.name_prefix}"
  kms_key_id             = aws_kms_key.cache.arn
  major_engine_version   = "7"
  security_group_ids     = var.security_group_ids
  snapshot_retention_limit = 5
  subnet_ids             = var.subnet_ids
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-redis-serverless"
  })
}

# KMS Key for ElastiCache encryption
resource "aws_kms_key" "cache" {
  description             = "KMS key for ElastiCache encryption"
  deletion_window_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-cache-kms-key"
  })
}

resource "aws_kms_alias" "cache" {
  name          = "alias/${var.name_prefix}-cache"
  target_key_id = aws_kms_key.cache.key_id
}
