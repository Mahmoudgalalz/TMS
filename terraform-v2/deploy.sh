#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed. Please install Terraform first."
    exit 1
fi

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install AWS CLI first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "Starting Terraform deployment..."

# Copy terraform.tfvars.example to terraform.tfvars if it doesn't exist
if [ ! -f "terraform.tfvars" ]; then
    print_warning "terraform.tfvars not found. Copying from terraform.tfvars.example"
    cp terraform.tfvars.example terraform.tfvars
    print_warning "Please review and update terraform.tfvars with your specific values"
fi

# Initialize Terraform
print_status "Initializing Terraform..."
terraform init

# Validate Terraform configuration
print_status "Validating Terraform configuration..."
terraform validate

# Plan the deployment
print_status "Planning Terraform deployment..."
terraform plan -out=tfplan

# Ask for confirmation
echo
read -p "Do you want to apply this plan? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled."
    exit 0
fi

# Apply the deployment
print_status "Applying Terraform deployment..."
terraform apply tfplan

# Clean up plan file
rm -f tfplan

print_status "Deployment completed successfully!"

# Get outputs
print_status "Deployment outputs:"
terraform output

print_status "Next steps:"
echo "1. Build and push your Docker images to the ECR repositories"
echo "2. Update the ECS services to use the new images"
echo "3. Scale up the services by updating desired_count or triggering auto-scaling"
echo "4. Update Secrets Manager with your actual secrets (SMTP, Cloudflare, etc.)"
echo "5. Monitor the CloudWatch dashboard for application health"
