# Quick Deploy Guide - Frontend to ECS Fargate

## ✅ Infrastructure Status
- **Frontend ECS Service**: `service-ticket-system-dev-frontend` (ACTIVE, 0/1 running)
- **API ECS Service**: `service-ticket-system-dev-api` (ACTIVE, 2/1 running) 
- **CPU/Memory**: Both services configured with 2 vCPU (2048) + 4GB memory (4096)
- **S3 Frontend**: Completely removed

## 🚀 Deploy Images

Run these commands to build and deploy both services:

```bash
# 1. Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 891819783983.dkr.ecr.us-east-1.amazonaws.com

# 2. Build and push API
docker build -t 891819783983.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-api:latest -f apps/api/Dockerfile .
docker push 891819783983.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-api:latest

# 3. Build and push Frontend  
docker build -t 891819783983.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-web:latest -f apps/web/Dockerfile .
docker push 891819783983.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-web:latest

# 4. Update ECS services
aws ecs update-service --cluster service-ticket-system-dev-cluster --service service-ticket-system-dev-api --force-new-deployment
aws ecs update-service --cluster service-ticket-system-dev-cluster --service service-ticket-system-dev-frontend --force-new-deployment
```

## 📋 Alternative: Use GitHub Actions

Push your code to trigger the automated deployment:
```bash
git add .
git commit -m "Deploy frontend to ECS Fargate with 2 vCPU/4GB"
git push origin main
```

## 🔍 Check Status

```bash
# Check service status
aws ecs describe-services --cluster service-ticket-system-dev-cluster --services service-ticket-system-dev-api service-ticket-system-dev-frontend --query 'services[*].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount}' --output table

# Check logs
aws logs tail /ecs/service-ticket-system-dev/api --follow
aws logs tail /ecs/service-ticket-system-dev/frontend --follow
```

## 🎯 What's Changed

- ✅ **Frontend**: Now runs as ECS Fargate service (not S3)
- ✅ **Resources**: 2 vCPU + 4GB memory for both services  
- ✅ **GitHub Actions**: Builds Docker images and deploys to ECS
- ✅ **S3 Cleanup**: All frontend S3 resources removed
- ✅ **ECR**: Both `api` and `web` repositories ready

The frontend will be accessible via its ECS task's public IP on port 80 once the Docker image is built and deployed.
