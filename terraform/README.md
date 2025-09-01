# Service Ticket Management System - Optimized Infrastructure v2

This directory contains the new optimized Terraform configuration for deploying the Service Ticket Management System on AWS with scale-to-zero capabilities and modern serverless architecture.

## Architecture Overview

### Key Features
- **Scale-to-Zero**: ECS services start with 0 tasks and auto-scale based on demand
- **Serverless Components**: Aurora Serverless v2 and ElastiCache Serverless
- **Cost Optimized**: Resources scale down when not in use
- **High Availability**: Multi-AZ deployment across 2 availability zones
- **Security**: Least privilege IAM roles, encrypted storage, private subnets
- **Monitoring**: CloudWatch dashboards, alarms, and log insights

### Infrastructure Components

1. **Networking**
   - Custom VPC with public/private subnets across 2 AZs
   - NAT Gateways for private subnet internet access
   - Security groups with least privilege access

2. **Compute**
   - ECS Fargate cluster with auto-scaling capabilities
   - Application Load Balancer for traffic distribution
   - Scale-to-zero configuration (min_capacity = 0)

3. **Database**
   - Aurora PostgreSQL Serverless v2 (0.5-1.0 ACU)
   - Automatic pause/resume capabilities
   - Encrypted storage with KMS

4. **Cache**
   - ElastiCache Serverless Redis
   - Auto-scaling based on usage
   - Encrypted in-transit and at-rest

5. **Container Registry**
   - ECR repositories for API and Web applications
   - Lifecycle policies for image management
   - Vulnerability scanning enabled

6. **Secrets Management**
   - AWS Secrets Manager for sensitive data
   - Automatic secret rotation support
   - Secure injection into ECS tasks

7. **Monitoring**
   - CloudWatch dashboards and alarms
   - Log aggregation and insights
   - SNS notifications for alerts

## Deployment Guide

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **Docker** for building container images
4. **Git** for version control

### Step 1: Configure Variables

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Update `terraform.tfvars` with your specific values:
   ```hcl
   aws_region = "us-east-1"
   project_name = "service-ticket-system"
   environment = "dev"
   # ... other variables
   ```

### Step 2: Deploy Infrastructure

Run the deployment script:
```bash
./deploy.sh
```

Or manually:
```bash
terraform init
terraform plan
terraform apply
```

### Step 3: Build and Push Container Images

1. Get ECR login token:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   ```

2. Build and push API image:
   ```bash
   cd ../../apps/api
   docker build --platform linux/amd64 -t service-ticket-system-dev-api .
   docker tag service-ticket-system-dev-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-api:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-api:latest
   ```

3. Build and push Web image:
   ```bash
   cd ../../apps/web
   docker build --platform linux/amd64 -t service-ticket-system-dev-web .
   docker tag service-ticket-system-dev-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-web:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/service-ticket-system-dev-web:latest
   ```

### Step 4: Update Secrets

Update the Secrets Manager secret with your actual values:
```bash
aws secretsmanager update-secret --secret-id service-ticket-system-dev-app-secrets --secret-string '{
  "CLOUDFLARE_API_TOKEN": "your-token",
  "CLOUDFLARE_ZONE_ID": "your-zone-id",
  "SMTP_HOST": "your-smtp-host",
  "SMTP_USER": "your-smtp-user",
  "SMTP_PASS": "your-smtp-password",
  "SMTP_FROM": "your-from-email"
}'
```

### Step 5: Scale Up Services

The services start with 0 tasks for cost optimization. Scale them up when needed:

```bash
# Scale API service
aws ecs update-service --cluster service-ticket-system-dev-cluster --service service-ticket-system-dev-api --desired-count 1

# Scale Frontend service
aws ecs update-service --cluster service-ticket-system-dev-cluster --service service-ticket-system-dev-frontend --desired-count 1
```

## Scale-to-Zero Configuration

### Auto Scaling Behavior
- **Minimum Capacity**: 0 tasks (true scale-to-zero)
- **Maximum Capacity**: 10 tasks (configurable)
- **Target CPU**: 70% utilization
- **Scale Up Cooldown**: 300 seconds
- **Scale Down Cooldown**: 300 seconds

### Cost Benefits
- **Aurora Serverless v2**: Automatically pauses when inactive
- **ElastiCache Serverless**: Scales to zero when not in use
- **ECS Fargate**: Pay only for running tasks
- **NAT Gateway**: Consider using NAT instances for further cost savings

## Monitoring and Alerts

### CloudWatch Dashboard
Access the dashboard via the output URL after deployment:
```
terraform output cloudwatch_dashboard_url
```

### Key Metrics Monitored
- ECS service CPU and memory utilization
- Running task counts
- Application logs and errors
- Database and cache performance

### Alerts
- High CPU/Memory utilization (>80%)
- Service down detection
- Error rate monitoring

## Security Features

### Network Security
- Private subnets for database and cache
- Security groups with minimal required access
- No direct internet access to backend services

### Data Security
- Encryption at rest for all storage
- Encryption in transit for all communications
- KMS keys for encryption management

### Access Control
- IAM roles with least privilege
- Secrets Manager for sensitive data
- No hardcoded credentials

## Troubleshooting

### Common Issues

1. **Services not starting**: Check CloudWatch logs for container errors
2. **Database connection issues**: Verify security group rules and secrets
3. **Load balancer health checks failing**: Check target group health check configuration
4. **Auto-scaling not working**: Verify CloudWatch metrics and scaling policies

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster service-ticket-system-dev-cluster --services service-ticket-system-dev-api

# View CloudWatch logs
aws logs tail /ecs/service-ticket-system-dev --follow

# Check auto-scaling activities
aws application-autoscaling describe-scaling-activities --service-namespace ecs
```

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

**Warning**: This will permanently delete all data. Ensure you have backups if needed.

## Cost Optimization Tips

1. **Use Spot Instances**: Configure ECS to use FARGATE_SPOT for non-critical workloads
2. **Right-size Resources**: Monitor usage and adjust CPU/memory allocations
3. **Schedule Scaling**: Use scheduled scaling for predictable traffic patterns
4. **Reserved Capacity**: Consider Aurora Reserved Instances for consistent workloads
5. **Log Retention**: Adjust CloudWatch log retention periods based on requirements

## Support

For issues or questions:
1. Check CloudWatch logs and metrics
2. Review Terraform state and outputs
3. Consult AWS documentation for service-specific issues
4. Use AWS Support for infrastructure-related problems
