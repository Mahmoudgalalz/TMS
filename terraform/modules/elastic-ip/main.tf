resource "aws_eip" "api_eip" {
  domain = "vpc"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-api-eip"
    Environment = var.environment
    Service     = "api"
  }
}

resource "aws_eip" "web_eip" {
  domain = "vpc"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-web-eip"
    Environment = var.environment
    Service     = "web"
  }
}

# Associate EIPs with ENIs (will be done via ECS task definitions)
resource "aws_eip_association" "api_eip_assoc" {
  count         = var.api_network_interface_id != "" ? 1 : 0
  allocation_id = aws_eip.api_eip.id
  network_interface_id = var.api_network_interface_id
}

resource "aws_eip_association" "web_eip_assoc" {
  count         = var.web_network_interface_id != "" ? 1 : 0
  allocation_id = aws_eip.web_eip.id
  network_interface_id = var.web_network_interface_id
}
