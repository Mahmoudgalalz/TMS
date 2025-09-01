variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the database"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs for the database"
  type        = list(string)
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
}

variable "master_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "Name of the database to create"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
