# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

# DB Parameter Group
resource "aws_rds_cluster_parameter_group" "main" {
  family = "aurora-postgresql16"
  name   = "${var.name_prefix}-cluster-pg"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-cluster-parameter-group"
  })
}

# KMS Key for Aurora encryption
resource "aws_kms_key" "aurora" {
  description             = "KMS key for Aurora cluster encryption"
  deletion_window_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-aurora-kms-key"
  })
}

resource "aws_kms_alias" "aurora" {
  name          = "alias/${var.name_prefix}-aurora"
  target_key_id = aws_kms_key.aurora.key_id
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "aurora" {
  name              = "/aws/rds/cluster/${var.name_prefix}-aurora-cluster/postgresql"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-aurora-logs"
  })
}

# Aurora Serverless v2 Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier     = "${var.name_prefix}-aurora-cluster"
  engine                 = "aurora-postgresql"
  engine_version         = "16.1"
  engine_mode           = "provisioned"
  database_name         = var.database_name
  master_username       = var.master_username
  master_password       = var.master_password
  
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name
  db_subnet_group_name           = aws_db_subnet_group.main.name
  vpc_security_group_ids         = var.security_group_ids
  
  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    max_capacity = 1.0
    min_capacity = 0.5
  }
  
  # Backup configuration
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  
  # Maintenance configuration
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  
  # Encryption
  storage_encrypted = true
  kms_key_id       = aws_kms_key.aurora.arn
  
  # Logging
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  # Deletion protection
  deletion_protection = false
  skip_final_snapshot = true
  
  # Performance Insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.aurora.arn
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-aurora-cluster"
  })
  
  depends_on = [aws_cloudwatch_log_group.aurora]
}

# Aurora Serverless v2 Instance
resource "aws_rds_cluster_instance" "main" {
  identifier         = "${var.name_prefix}-aurora-instance-1"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn         = aws_iam_role.rds_enhanced_monitoring.arn
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-aurora-instance-1"
  })
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.name_prefix}-rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-rds-enhanced-monitoring-role"
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
