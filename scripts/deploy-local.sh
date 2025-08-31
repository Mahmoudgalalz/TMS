#!/bin/bash

# Local deployment script for Service Ticket System
set -e

# Configuration
AWS_REGION="us-east-1"
ECR_API_REPO="891819783983.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-api"
ECR_WEB_REPO="891819783983.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-web"
ECS_CLUSTER="service-ticket-system-dev-cluster"
ECS_SERVICE="service-ticket-system-dev-api"
S3_BUCKET="service-ticket-system-dev-frontend-rf0jp0vo"

echo "🚀 Starting local deployment..."

# Login to ECR
echo "📦 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin 891819783983.dkr.ecr.us-east-1.amazonaws.com

# Build and push API image
echo "🔨 Building API Docker image..."
docker build -t $ECR_API_REPO:latest -f apps/api/Dockerfile .
echo "📤 Pushing API image to ECR..."
docker push $ECR_API_REPO:latest

# Build and push Web image  
echo "🔨 Building Web Docker image..."
docker build -t $ECR_WEB_REPO:latest -f apps/web/Dockerfile .
echo "📤 Pushing Web image to ECR..."
docker push $ECR_WEB_REPO:latest

# Build and deploy frontend to S3
echo "🌐 Building frontend..."
cd apps/web
pnpm install
VITE_API_URL="http://localhost:3001" pnpm build
cd ../..

echo "📤 Deploying frontend to S3..."
aws s3 sync apps/web/dist/ s3://$S3_BUCKET --delete
aws s3 cp apps/web/dist/index.html s3://$S3_BUCKET/index.html --cache-control "no-cache"

# Update ECS service to pull new image
echo "🔄 Updating ECS service..."
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment

echo "✅ Deployment complete!"
echo "📊 Monitor deployment:"
echo "   ECS Service: https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/$ECS_CLUSTER/services/$ECS_SERVICE"
echo "   CloudWatch Logs: https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/%2Fecs%2Fservice-ticket-system-dev%2Fapi"
echo "   S3 Website: https://$S3_BUCKET.s3.amazonaws.com/index.html"
