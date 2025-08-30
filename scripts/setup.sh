#!/bin/bash

# Setup Script for Service Ticket Management System AWS Deployment
# This script helps set up the initial environment and prerequisites

set -e

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

# Create S3 bucket for Terraform state
create_terraform_state_bucket() {
    local bucket_name="service-ticket-system-terraform-state-$(date +%s)"
    local region="us-east-1"
    
    log_info "Creating S3 bucket for Terraform state: $bucket_name"
    
    aws s3 mb "s3://$bucket_name" --region "$region"
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "$bucket_name" \
        --versioning-configuration Status=Enabled
    
    # Enable server-side encryption
    aws s3api put-bucket-encryption \
        --bucket "$bucket_name" \
        --server-side-encryption-configuration '{
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        }'
    
    # Block public access
    aws s3api put-public-access-block \
        --bucket "$bucket_name" \
        --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
    
    log_success "Terraform state bucket created: $bucket_name"
    log_warning "Please update your Terraform backend configuration with this bucket name"
    
    echo "Add this to your terraform/main.tf:"
    echo "terraform {"
    echo "  backend \"s3\" {"
    echo "    bucket = \"$bucket_name\""
    echo "    region = \"$region\""
    echo "  }"
    echo "}"
}

# Create DynamoDB table for Terraform state locking
create_terraform_lock_table() {
    local table_name="service-ticket-system-terraform-locks"
    
    log_info "Creating DynamoDB table for Terraform state locking: $table_name"
    
    aws dynamodb create-table \
        --table-name "$table_name" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region us-east-1
    
    log_success "Terraform lock table created: $table_name"
    log_warning "Please update your Terraform backend configuration with this table name"
    
    echo "Add this to your terraform/main.tf backend configuration:"
    echo "    dynamodb_table = \"$table_name\""
}

# Setup environment variables template
create_env_template() {
    log_info "Creating environment variables template..."
    
    cat > .env.example << 'EOF'
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id

# Database Configuration
DB_MASTER_PASSWORD=your-secure-database-password

# Application Secrets
JWT_SECRET=your-jwt-secret-key
AI_SECRET=your-ai-service-secret

# Cloudflare Configuration (for AI service)
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token

# Monitoring
NOTIFICATION_EMAIL=admin@yourcompany.com

# Optional: Custom Domain
# DOMAIN_NAME=yourapp.com
# CERTIFICATE_ARN=arn:aws:acm:us-east-1:account:certificate/cert-id
EOF
    
    log_success "Environment template created: .env.example"
    log_warning "Please copy .env.example to .env and fill in your actual values"
}

# Validate AWS credentials and permissions
validate_aws_setup() {
    log_info "Validating AWS setup..."
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        return 1
    fi
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local user_arn=$(aws sts get-caller-identity --query Arn --output text)
    
    log_success "AWS credentials configured"
    log_info "Account ID: $account_id"
    log_info "User/Role: $user_arn"
    
    # Test required permissions
    log_info "Testing required AWS permissions..."
    
    # Test S3 permissions
    if aws s3 ls &> /dev/null; then
        log_success "S3 permissions: OK"
    else
        log_error "S3 permissions: FAILED"
    fi
    
    # Test EC2 permissions
    if aws ec2 describe-regions --region us-east-1 &> /dev/null; then
        log_success "EC2 permissions: OK"
    else
        log_error "EC2 permissions: FAILED"
    fi
    
    # Test ECS permissions
    if aws ecs list-clusters --region us-east-1 &> /dev/null; then
        log_success "ECS permissions: OK"
    else
        log_error "ECS permissions: FAILED"
    fi
    
    # Test RDS permissions
    if aws rds describe-db-clusters --region us-east-1 &> /dev/null; then
        log_success "RDS permissions: OK"
    else
        log_error "RDS permissions: FAILED"
    fi
}

# Main setup function
main() {
    log_info "Starting setup for Service Ticket Management System AWS deployment"
    
    # Validate AWS setup
    validate_aws_setup
    
    # Create environment template
    create_env_template
    
    # Offer to create Terraform state resources
    read -p "Do you want to create S3 bucket for Terraform state? (y/n): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_terraform_state_bucket
    fi
    
    read -p "Do you want to create DynamoDB table for Terraform state locking? (y/n): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_terraform_lock_table
    fi
    
    log_success "Setup completed!"
    log_info "Next steps:"
    echo "1. Copy .env.example to .env and fill in your values"
    echo "2. Update terraform/main.tf with your S3 backend configuration"
    echo "3. Run: ./scripts/deploy.sh dev init"
    echo "4. Run: ./scripts/deploy.sh dev plan"
    echo "5. Run: ./scripts/deploy.sh dev apply"
}

# Run main function
main "$@"
