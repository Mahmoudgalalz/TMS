variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "api_network_interface_id" {
  description = "Network interface ID for API service"
  type        = string
  default     = ""
}

variable "web_network_interface_id" {
  description = "Network interface ID for web service"
  type        = string
  default     = ""
}
