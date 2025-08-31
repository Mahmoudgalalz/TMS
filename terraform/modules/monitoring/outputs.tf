output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

# Cost anomaly detector output commented out - resource not supported in all regions
# output "cost_anomaly_detector_arn" {
#   description = "Cost anomaly detector ARN"
#   value       = aws_ce_anomaly_detector.cost.arn
# }

output "log_insights_queries" {
  description = "CloudWatch Log Insights query names"
  value = {
    error_logs     = aws_cloudwatch_query_definition.error_logs.name
    slow_requests  = aws_cloudwatch_query_definition.slow_requests.name
  }
}
