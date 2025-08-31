#!/bin/bash

# Deploy Docker Images to ECS
# This script builds and pushes both API and frontend Docker images to ECR

set -e

# Configuration
AWS_REGION="us-east-1"
ECR_API_REPO="891819783983.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-api"
ECR_WEB_REPO="891819783983.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-web"
ECS_CLUSTER="service-ticket-system-dev-cluster"
ECS_API_SERVICE="service-ticket-system-dev-api"
ECS_FRONTEND_SERVICE="service-ticket-system-dev-frontend"

echo "🚀 Starting deployment process..."

# Login to ECR
echo "📝 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin 891819783983.dkr.ecr.us-east-1.amazonaws.com

# Build and push API image
echo "🔨 Building API Docker image..."
docker build -t $ECR_API_REPO:latest -f apps/api/Dockerfile .

echo "📤 Pushing API image to ECR..."
docker push $ECR_API_REPO:latest

# Build and push Frontend image
echo "🔨 Building Frontend Docker image..."
docker build -t $ECR_WEB_REPO:latest -f apps/web/Dockerfile .

echo "📤 Pushing Frontend image to ECR..."
docker push $ECR_WEB_REPO:latest

# Update ECS services
echo "🔄 Updating ECS API service..."
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_API_SERVICE --force-new-deployment

echo "🔄 Updating ECS Frontend service..."
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_FRONTEND_SERVICE --force-new-deployment

echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_API_SERVICE $ECS_FRONTEND_SERVICE --query 'services[*].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount}' --output table

echo ""
echo "🔗 Useful Commands:"
echo "  Check logs: aws logs tail /ecs/service-ticket-system-dev/api --follow"
echo "  Check logs: aws logs tail /ecs/service-ticket-system-dev/frontend --follow"
echo "  Dashboard: https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=service-ticket-system-dev-dashboard"
