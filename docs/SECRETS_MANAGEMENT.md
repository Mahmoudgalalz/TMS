# AWS Secrets Manager Integration

This document explains how secrets are managed in the Service Ticket Management System using AWS Secrets Manager for enhanced security.

## Overview

The infrastructure now uses AWS Secrets Manager to securely store and manage sensitive configuration values instead of plain text environment variables. This provides:

- **Enhanced Security**: Secrets are encrypted at rest and in transit
- **Automatic Rotation**: Support for automatic secret rotation
- **Access Control**: Fine-grained IAM permissions for secret access
- **Audit Trail**: CloudTrail logging for secret access
- **Auto-Generation**: Automatic generation of secure random passwords

## Architecture

### Secrets Manager Module

The `terraform/modules/secrets/` module creates and manages:

1. **Database Master Password Secret**: Stores the PostgreSQL master password
2. **JWT Secret**: Stores the JWT signing key for authentication
3. **Application Configuration Secret**: JSON object containing multiple app secrets
4. **IAM Role and Policies**: ECS task permissions for secret access

### Secret Categories

#### Database Secrets
- `db-master-password`: PostgreSQL database master password

#### Application Secrets
- `jwt-secret`: JWT signing key for authentication
- `app-config`: JSON containing:
  - `REDIS_PASSWORD`: Redis authentication token
  - `SMTP_PASSWORD`: Email service password
  - `CLOUDFLARE_TOKEN`: Cloudflare API token
  - `ENCRYPTION_KEY`: Application-level encryption key
  - `WEBHOOK_SECRET`: Webhook validation secret
  - `API_KEY`: General external API key

## ECS Integration

### Task Definition Changes

ECS task definitions now use the `secrets` parameter instead of `environment` for sensitive values:

```json
{
  "secrets": [
    {
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-password"
    },
    {
      "name": "JWT_SECRET", 
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
    }
  ]
}
```

### IAM Permissions

The ECS task execution role has permissions to:
- `secretsmanager:GetSecretValue` on specific secret ARNs
- Access only the secrets required by the application

## Deployment Process

### 1. Configure Variables

Copy and update the terraform variables:
```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

Edit `terraform.tfvars` with your configuration:
```hcl
# Leave empty for auto-generation or provide your own
db_master_password = ""  # Auto-generated if empty
jwt_secret = ""          # Auto-generated if empty
redis_password = ""      # Auto-generated if empty

# Provide your own values for external services
smtp_password = "your-smtp-password"
cloudflare_token = "your-cloudflare-token"
```

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply
```

### 3. Retrieve Generated Secrets

For auto-generated secrets, retrieve them from AWS Secrets Manager:

```bash
# Get database password
aws secretsmanager get-secret-value \
  --secret-id "service-ticket-system-dev-db-master-password" \
  --query SecretString --output text

# Get JWT secret
aws secretsmanager get-secret-value \
  --secret-id "service-ticket-system-dev-jwt-secret" \
  --query SecretString --output text
```

## Application Code Changes

### Environment Variables

The application should expect these environment variables:

```bash
# Database connection (host provided as env var, password from secrets)
DATABASE_HOST=aurora-cluster-endpoint
DB_PASSWORD=<from-secrets-manager>

# Redis connection
REDIS_HOST=redis-cluster-endpoint
REDIS_PASSWORD=<from-app-config-secret>

# Authentication
JWT_SECRET=<from-secrets-manager>

# External services (from app-config secret)
SMTP_PASSWORD=<from-app-config-secret>
CLOUDFLARE_TOKEN=<from-app-config-secret>
```

### Parsing JSON Secrets

For the `APP_CONFIG` secret (JSON format), parse it in your application:

```javascript
// Node.js example
const appConfig = JSON.parse(process.env.APP_CONFIG);
const redisPassword = appConfig.REDIS_PASSWORD;
const smtpPassword = appConfig.SMTP_PASSWORD;
```

## Security Best Practices

### 1. Least Privilege Access
- ECS tasks only have access to secrets they need
- Secrets are scoped to specific ARNs
- No wildcard permissions

### 2. Secret Rotation
- Enable automatic rotation for database passwords
- Regularly rotate API keys and tokens
- Use versioned secrets for zero-downtime updates

### 3. Monitoring and Auditing
- CloudTrail logs all secret access
- CloudWatch alarms for unusual access patterns
- Regular security reviews of IAM policies

### 4. Development vs Production
- Use separate secrets for each environment
- Never share production secrets in development
- Use different AWS accounts for isolation

## Troubleshooting

### Common Issues

#### 1. ECS Task Cannot Access Secrets
**Symptoms**: Task fails to start, "Unable to retrieve secret" errors

**Solutions**:
- Verify IAM role has `secretsmanager:GetSecretValue` permission
- Check secret ARN is correct in task definition
- Ensure secret exists in the same region

#### 2. Secret Not Found
**Symptoms**: "ResourceNotFoundException" errors

**Solutions**:
- Verify secret name matches Terraform output
- Check AWS region is correct
- Confirm secret was created successfully

#### 3. Invalid JSON in App Config Secret
**Symptoms**: JSON parsing errors in application

**Solutions**:
- Validate JSON format in AWS console
- Check for trailing commas or syntax errors
- Use `aws secretsmanager get-secret-value` to verify content

### Useful Commands

```bash
# List all secrets
aws secretsmanager list-secrets

# Get secret value
aws secretsmanager get-secret-value --secret-id <secret-name>

# Update secret value
aws secretsmanager update-secret --secret-id <secret-name> --secret-string <new-value>

# Describe secret (metadata only)
aws secretsmanager describe-secret --secret-id <secret-name>
```

## Migration from Environment Variables

If migrating from plain environment variables:

1. **Update Task Definitions**: Replace `environment` with `secrets`
2. **Update IAM Roles**: Add Secrets Manager permissions
3. **Test Applications**: Verify secret retrieval works
4. **Remove Plain Text**: Clean up old environment variables
5. **Update Documentation**: Update deployment guides

## Cost Considerations

AWS Secrets Manager pricing:
- $0.40 per secret per month
- $0.05 per 10,000 API calls
- Additional charges for automatic rotation

For this infrastructure:
- ~3-4 secrets = ~$1.60/month
- Minimal API call costs for ECS task startup
- Significant security benefits outweigh costs

## Next Steps

1. **Enable Rotation**: Set up automatic rotation for database passwords
2. **Add Monitoring**: Create CloudWatch alarms for secret access
3. **Implement Backup**: Regular backup of secret values
4. **Documentation**: Update application deployment guides
5. **Training**: Train team on secrets management best practices
