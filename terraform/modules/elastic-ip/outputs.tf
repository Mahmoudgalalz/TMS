output "api_eip_id" {
  description = "Allocation ID of the API Elastic IP"
  value       = aws_eip.api_eip.id
}

output "api_public_ip" {
  description = "Public IP address of the API service"
  value       = aws_eip.api_eip.public_ip
}

output "web_eip_id" {
  description = "Allocation ID of the Web Elastic IP"
  value       = aws_eip.web_eip.id
}

output "web_public_ip" {
  description = "Public IP address of the Web service"
  value       = aws_eip.web_eip.public_ip
}
