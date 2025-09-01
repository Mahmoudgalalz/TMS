variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "repositories" {
  description = "List of ECR repositories to create"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
