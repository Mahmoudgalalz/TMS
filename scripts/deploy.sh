#!/bin/bash

# AWS Deployment Script for Service Ticket Management System
# Usage: ./scripts/deploy.sh [environment] [action]
# Example: ./scripts/deploy.sh dev plan
# Example: ./scripts/deploy.sh prod apply

set -e

# Default values
ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'dev' or 'prod'"
        exit 1
    fi
}

# Validate action
validate_action() {
    if [[ ! "$ACTION" =~ ^(plan|apply|destroy|init|validate)$ ]]; then
        log_error "Invalid action: $ACTION. Must be one of: plan, apply, destroy, init, validate"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Initialize Terraform
init_terraform() {
    log_info "Initializing Terraform..."
    cd "$TERRAFORM_DIR"
    
    terraform init \
        -backend-config="key=service-ticket-system-${ENVIRONMENT}.tfstate" \
        -backend-config="region=us-east-1"
    
    log_success "Terraform initialized"
}

# Validate Terraform configuration
validate_terraform() {
    log_info "Validating Terraform configuration..."
    cd "$TERRAFORM_DIR"
    
    terraform validate
    
    log_success "Terraform configuration is valid"
}

# Plan Terraform deployment
plan_terraform() {
    log_info "Planning Terraform deployment for $ENVIRONMENT environment..."
    cd "$TERRAFORM_DIR"
    
    terraform plan \
        -var-file="environments/${ENVIRONMENT}/terraform.tfvars" \
        -out="${ENVIRONMENT}.tfplan"
    
    log_success "Terraform plan completed. Review the plan above."
    log_warning "To apply the plan, run: ./scripts/deploy.sh $ENVIRONMENT apply"
}

# Apply Terraform deployment
apply_terraform() {
    log_info "Applying Terraform deployment for $ENVIRONMENT environment..."
    cd "$TERRAFORM_DIR"
    
    if [[ -f "${ENVIRONMENT}.tfplan" ]]; then
        terraform apply "${ENVIRONMENT}.tfplan"
        rm -f "${ENVIRONMENT}.tfplan"
    else
        log_warning "No plan file found. Running plan and apply..."
        terraform apply \
            -var-file="environments/${ENVIRONMENT}/terraform.tfvars" \
            -auto-approve
    fi
    
    log_success "Terraform deployment completed"
    
    # Output important information
    log_info "Retrieving deployment outputs..."
    terraform output
}

# Destroy Terraform deployment
destroy_terraform() {
    log_warning "This will destroy all resources in the $ENVIRONMENT environment!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Destroying Terraform deployment for $ENVIRONMENT environment..."
        cd "$TERRAFORM_DIR"
        
        terraform destroy \
            -var-file="environments/${ENVIRONMENT}/terraform.tfvars" \
            -auto-approve
        
        log_success "Terraform destruction completed"
    else
        log_info "Destruction cancelled"
    fi
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Get ECR repository URLs from Terraform output
    cd "$TERRAFORM_DIR"
    API_REPO=$(terraform output -raw ecr_repositories | jq -r '.api')
    WEB_REPO=$(terraform output -raw ecr_repositories | jq -r '.web')
    AI_SERVICE_REPO=$(terraform output -raw ecr_repositories | jq -r '.ai_service')
    
    # Login to ECR
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(echo $API_REPO | cut -d'/' -f1)
    
    cd "$PROJECT_ROOT"
    
    # Build and push API image
    log_info "Building API image..."
    docker build -f apps/api/Dockerfile -t $API_REPO:latest .
    docker push $API_REPO:latest
    
    # Build and push AI Service image
    log_info "Building AI Service image..."
    docker build -f Dockerfile.ai-service -t $AI_SERVICE_REPO:latest .
    docker push $AI_SERVICE_REPO:latest
    
    # Note: Web image is handled by S3/CloudFront, not ECR
    
    log_success "Docker images built and pushed"
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    # Build and push images
    build_and_push_images
    
    # Update ECS services
    cd "$TERRAFORM_DIR"
    CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
    API_SERVICE=$(terraform output -raw ecs_service_names | jq -r '.api')
    AI_SERVICE=$(terraform output -raw ecs_service_names | jq -r '.ai_service')
    
    log_info "Updating ECS services..."
    aws ecs update-service --cluster $CLUSTER_NAME --service $API_SERVICE --force-new-deployment
    aws ecs update-service --cluster $CLUSTER_NAME --service $AI_SERVICE --force-new-deployment
    
    log_info "Waiting for services to stabilize..."
    aws ecs wait services-stable --cluster $CLUSTER_NAME --services $API_SERVICE $AI_SERVICE
    
    log_success "Application deployment completed"
}

# Main execution
main() {
    log_info "Starting deployment script for $ENVIRONMENT environment with action: $ACTION"
    
    validate_environment
    validate_action
    check_prerequisites
    
    case $ACTION in
        init)
            init_terraform
            ;;
        validate)
            validate_terraform
            ;;
        plan)
            init_terraform
            validate_terraform
            plan_terraform
            ;;
        apply)
            init_terraform
            validate_terraform
            apply_terraform
            deploy_application
            ;;
        destroy)
            destroy_terraform
            ;;
        *)
            log_error "Unknown action: $ACTION"
            exit 1
            ;;
    esac
    
    log_success "Script completed successfully!"
}

# Run main function
main "$@"
