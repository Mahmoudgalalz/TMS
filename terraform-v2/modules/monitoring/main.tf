# Data sources
data "aws_region" "current" {}

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
            [".", "MemoryUtilization", ".", ".", ".", "."],
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.ecs_service_names.frontend, "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "ECS Service Resource Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "RunningTaskCount", "ServiceName", var.ecs_service_names.api, "ClusterName", var.ecs_cluster_name],
            [".", ".", "ServiceName", var.ecs_service_names.frontend, "ClusterName", var.ecs_cluster_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "ECS Running Task Count"
          period  = 300
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6

        properties = {
          query   = "SOURCE '/ecs/${var.name_prefix}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 100"
          region  = data.aws_region.current.name
          title   = "Recent ECS Logs"
          view    = "table"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu_api" {
  alarm_name          = "${var.name_prefix}-api-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS API service CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = var.ecs_service_names.api
    ClusterName = var.ecs_cluster_name
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-high-cpu-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "high_memory_api" {
  alarm_name          = "${var.name_prefix}-api-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS API service memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = var.ecs_service_names.api
    ClusterName = var.ecs_cluster_name
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-high-memory-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "service_down_api" {
  alarm_name          = "${var.name_prefix}-api-service-down"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RunningTaskCount"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors if API service is running"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    ServiceName = var.ecs_service_names.api
    ClusterName = var.ecs_cluster_name
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-service-down-alarm"
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-alerts"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-sns-alerts"
  })
}

# CloudWatch Log Insights Queries
resource "aws_cloudwatch_query_definition" "error_logs" {
  name = "${var.name_prefix}-error-logs"

  log_group_names = [
    "/ecs/${var.name_prefix}"
  ]

  query_string = <<EOF
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "api_performance" {
  name = "${var.name_prefix}-api-performance"

  log_group_names = [
    "/ecs/${var.name_prefix}"
  ]

  query_string = <<EOF
fields @timestamp, @message
| filter @message like /api/
| stats count() by bin(5m)
| sort @timestamp desc
EOF
}
