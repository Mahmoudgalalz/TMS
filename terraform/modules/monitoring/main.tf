# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-alerts"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alerts-topic"
  })
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "email" {
  count = var.notification_email != "" ? 1 : 0
  
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.ecs_service_names.api, "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "ECS Service Metrics"
          period  = 300
        }
      },
      # ALB Metrics - Commented out due to AWS account limitations
      # {
      #   type   = "metric"
      #   x      = 12
      #   y      = 0
      #   width  = 12
      #   height = 6
      #
      #   properties = {
      #     metrics = [
      #       ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix],
      #       [".", "TargetResponseTime", ".", "."],
      #       [".", "HTTPCode_Target_2XX_Count", ".", "."],
      #       [".", "HTTPCode_Target_4XX_Count", ".", "."],
      #       [".", "HTTPCode_Target_5XX_Count", ".", "."]
      #     ]
      #     view    = "timeSeries"
      #     stacked = false
      #     region  = "us-east-1"
      #     title   = "ALB Metrics"
      #     period  = 300
      #   }
      # },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", var.database_cluster_identifier],
            [".", "DatabaseConnections", ".", "."],
            [".", "ServerlessDatabaseCapacity", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Database Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "${var.name_prefix}-redis-001"],
            [".", "NetworkBytesIn", ".", "."],
            [".", "NetworkBytesOut", ".", "."],
            [".", "CurrConnections", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Cache Metrics"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms for ECS Services
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  for_each = var.ecs_service_names

  alarm_name          = "${var.name_prefix}-${each.key}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS ${each.key} CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name = "${var.name_prefix}-${each.key}-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  for_each = var.ecs_service_names

  alarm_name          = "${var.name_prefix}-${each.key}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS ${each.key} memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${each.key}-memory-alarm"
  })
}

# CloudWatch Alarms for Database
resource "aws_cloudwatch_metric_alarm" "database_cpu_high" {
  alarm_name          = "${var.name_prefix}-database-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.database_cluster_identifier
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-database-cpu-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "database_connections_high" {
  alarm_name          = "${var.name_prefix}-database-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.database_cluster_identifier
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-database-connections-alarm"
  })
}

# CloudWatch Alarms for Load Balancer
# ALB Response Time Alarm - Commented out due to AWS account limitations
# resource "aws_cloudwatch_metric_alarm" "alb_response_time_high" {
#   alarm_name          = "${var.name_prefix}-alb-response-time-high"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = "2"
#   metric_name         = "TargetResponseTime"
#   namespace           = "AWS/ApplicationELB"
#   period              = "300"
#   statistic           = "Average"
#   threshold           = "2"
#   alarm_description   = "This metric monitors ALB response time"
#   alarm_actions       = [aws_sns_topic.alerts.arn]
#
#   dimensions = {
#     LoadBalancer = var.alb_arn_suffix
#   }
#
#   tags = merge(var.tags, {
#     Name = "${var.name_prefix}-alb-response-time-alarm"
#   })
# }

# ALB Response Time Alarm - Commented out due to AWS account limitations
# resource "aws_cloudwatch_metric_alarm" "alb_response_time_high" {
#   alarm_name          = "${var.name_prefix}-alb-response-time-high"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = "2"
#   metric_name         = "TargetResponseTime"
#   namespace           = "AWS/ApplicationELB"
#   period              = "300"
#   statistic           = "Average"
#   threshold           = "2"
#   alarm_description   = "This metric monitors ALB response time"
#   alarm_actions       = [aws_sns_topic.alerts.arn]
#
#   dimensions = {
#     LoadBalancer = var.alb_arn_suffix
#   }
#
#   tags = merge(var.tags, {
#     Name = "${var.name_prefix}-alb-response-time-alarm"
#   })
# }

# ALB 5xx Errors Alarm - Commented out due to AWS account limitations
# resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
#   alarm_name          = "${var.name_prefix}-alb-5xx-errors"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = "2"
#   metric_name         = "HTTPCode_Target_5XX_Count"
#   namespace           = "AWS/ApplicationELB"
#   period              = "300"
#   statistic           = "Sum"
#   threshold           = "10"
#   alarm_description   = "This metric monitors ALB 5xx errors"
#   alarm_actions       = [aws_sns_topic.alerts.arn]
#
#   dimensions = {
#     LoadBalancer = var.alb_arn_suffix
#   }
#
#   tags = merge(var.tags, {
#     Name = "${var.name_prefix}-alb-5xx-errors-alarm"
#   })
# }

# Cost Anomaly Detection - Commented out due to unsupported resource
# resource "aws_ce_anomaly_detector" "cost" {
#   name         = "${var.name_prefix}-cost-anomaly-detector"
#   monitor_type = "DIMENSIONAL"
#   specification = jsonencode({
#     Dimension = "SERVICE"
#     MatchOptions = ["EQUALS"]
#     Values = ["Amazon Elastic Container Service", "Amazon Relational Database Service", "Amazon ElastiCache"]
#   })
#
#   tags = merge(var.tags, {
#     Name = "${var.name_prefix}-cost-anomaly-detector"
#   })
# }

# resource "aws_ce_anomaly_subscription" "cost" {
#   name      = "${var.name_prefix}-cost-anomaly-subscription"
#   frequency = "DAILY"
#   
#   monitor_arn_list = [
#     aws_ce_anomaly_detector.cost.arn
#   ]
#   
#   subscriber {
#     type    = "EMAIL"
#     address = var.notification_email
#   }
#
#   threshold_expression {
#     and {
#       dimension {
#         key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
#         values        = ["100"]
#         match_options = ["GREATER_THAN_OR_EQUAL"]
#       }
#     }
#   }
#
#   tags = merge(var.tags, {
#     Name = "${var.name_prefix}-cost-anomaly-subscription"
#   })
# }

# CloudWatch Log Insights Queries
resource "aws_cloudwatch_query_definition" "error_logs" {
  name = "${var.name_prefix}-error-logs"

  log_group_names = [
    "/ecs/${var.name_prefix}/api",
    "/ecs/${var.name_prefix}/ai-service"
  ]

  query_string = <<EOF
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "slow_requests" {
  name = "${var.name_prefix}-slow-requests"

  log_group_names = [
    "/ecs/${var.name_prefix}/api"
  ]

  query_string = <<EOF
fields @timestamp, @message
| filter @message like /duration/
| parse @message /duration: (?<duration>\d+)/
| filter duration > 1000
| sort @timestamp desc
| limit 50
EOF
}

# Data source
data "aws_region" "current" {}
