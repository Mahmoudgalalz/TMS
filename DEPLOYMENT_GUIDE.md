# Quick Deployment Guide

## Current Status
✅ Infrastructure deployed successfully  
❌ No application images in ECR  
❌ Frontend not built/deployed to S3  
❌ ECS tasks failing due to missing images  

## Quick Fix Commands

### 1. Build and Push API Image
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 891819783983.dkr.ecr.us-east-1.amazonaws.com

# Build and push API
docker build -t 891819783983.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-api:latest -f apps/api/Dockerfile .
docker push 891819783983.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-api:latest

# Force ECS service update
aws ecs update-service --cluster service-ticket-system-dev-cluster --service service-ticket-system-dev-api --force-new-deployment
```

### 2. Build and Deploy Frontend
```bash
# Install dependencies and build
cd apps/web
npm install
VITE_API_URL="http://api.service-ticket-system-dev-cluster.local:3001" npm run build

# Deploy to S3
aws s3 sync dist/ s3://service-ticket-system-dev-frontend-rf0jp0vo --delete
aws s3 cp dist/index.html s3://service-ticket-system-dev-frontend-rf0jp0vo/index.html --cache-control "no-cache"
```

### 3. Check Deployment Status
```bash
# Check ECS service
aws ecs describe-services --cluster service-ticket-system-dev-cluster --services service-ticket-system-dev-api

# Check logs
aws logs get-log-events --log-group-name "/ecs/service-ticket-system-dev/api" --log-stream-name $(aws logs describe-log-streams --log-group-name "/ecs/service-ticket-system-dev/api" --order-by LastEventTime --descending --limit 1 --query 'logStreams[0].logStreamName' --output text)

# Check S3 contents
aws s3 ls s3://service-ticket-system-dev-frontend-rf0jp0vo
```

## Access URLs
- **Frontend**: https://service-ticket-system-dev-frontend-rf0jp0vo.s3.amazonaws.com/index.html
- **CloudWatch Dashboard**: https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=service-ticket-system-dev-dashboard
- **ECS Console**: https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/service-ticket-system-dev-cluster/services

## GitHub Actions Alternative
The `.github/workflows/deploy.yml` file has been created for automated deployments. Set these secrets in your GitHub repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Issues Fixed
- ✅ Aurora PostgreSQL auto-pause enabled (engine 13.15)
- ✅ ALB/CloudFront disabled due to account limitations  
- ✅ ECS health check updated to correct port (3001)
- ✅ Fargate CPU/memory configuration fixed (256/512)
