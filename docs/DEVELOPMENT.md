# Local Development Setup

This guide explains how to set up the Service Ticket Management System for local development using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development without Docker)
- Git

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd personal-website
```

### 2. Environment Configuration

```bash
# Copy environment files
cp .env.local.example .env.local
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit .env.local with your preferences (optional)
nano .env.local
```

### 3. Start Development Environment

```bash
# Start all services (database, Redis, API, web)
docker-compose -f docker-compose.local.yml up -d

# Or start with logs visible
docker-compose -f docker-compose.local.yml up
```

### 4. Access Services

- **Web Application**: http://localhost:5173
- **API Documentation**: http://localhost:3001/api/docs
- **API Health Check**: http://localhost:3001/health
- **pgAdmin** (optional): http://localhost:8080
- **Redis Commander** (optional): http://localhost:8081

## Services Overview

### Core Services

| Service | Port | Description |
|---------|------|-------------|
| **web** | 5173 | React frontend with Vite |
| **api** | 3001 | NestJS backend API |
| **postgres** | 5432 | PostgreSQL database |
| **redis** | 6379 | Redis cache and queue |

### Optional Tools (use `--profile tools`)

| Service | Port | Credentials | Description |
|---------|------|-------------|-------------|
| **pgadmin** | 8080 | admin@example.com / admin | Database management |
| **redis-commander** | 8081 | admin / admin | Redis management |

## Development Workflows

### Starting Services

```bash
# Start core services only
docker-compose -f docker-compose.local.yml up -d

# Start with admin tools
docker-compose -f docker-compose.local.yml --profile tools up -d

# Start specific services
docker-compose -f docker-compose.local.yml up -d postgres redis
```

### Viewing Logs

```bash
# All services
docker-compose -f docker-compose.local.yml logs -f

# Specific service
docker-compose -f docker-compose.local.yml logs -f api

# Last 100 lines
docker-compose -f docker-compose.local.yml logs --tail=100 api
```

### Database Operations

```bash
# Connect to database
docker-compose -f docker-compose.local.yml exec postgres psql -U postgres -d service_tickets

# Run database migrations (if using TypeORM/Drizzle)
docker-compose -f docker-compose.local.yml exec api npm run migration:run

# Seed database with sample data
docker-compose -f docker-compose.local.yml exec api npm run seed

# Reset database
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d postgres
```

### Redis Operations

```bash
# Connect to Redis CLI
docker-compose -f docker-compose.local.yml exec redis redis-cli -a redispassword

# Monitor Redis commands
docker-compose -f docker-compose.local.yml exec redis redis-cli -a redispassword monitor

# Clear Redis cache
docker-compose -f docker-compose.local.yml exec redis redis-cli -a redispassword FLUSHALL
```

## Development Tips

### Hot Reloading

Both API and web services support hot reloading:

- **API**: Uses nodemon for automatic restart on file changes
- **Web**: Uses Vite's HMR for instant updates

### Code Changes

```bash
# API changes - container will auto-restart
# Edit files in apps/api/src/

# Web changes - browser will auto-refresh
# Edit files in apps/web/src/
```

### Debugging

#### API Debugging

```bash
# View API logs
docker-compose -f docker-compose.local.yml logs -f api

# Connect to API container
docker-compose -f docker-compose.local.yml exec api sh

# Check API health
curl http://localhost:3001/health
```

#### Database Debugging

```bash
# Check database connection
docker-compose -f docker-compose.local.yml exec postgres pg_isready -U postgres

# View database logs
docker-compose -f docker-compose.local.yml logs postgres

# Connect to database
docker-compose -f docker-compose.local.yml exec postgres psql -U postgres -d service_tickets
```

## Environment Variables

### API Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | postgres | Database hostname |
| `DB_PORT` | 5432 | Database port |
| `DB_USERNAME` | postgres | Database username |
| `DB_PASSWORD` | password | Database password |
| `DB_NAME` | service_tickets | Database name |
| `REDIS_HOST` | redis | Redis hostname |
| `REDIS_PORT` | 6379 | Redis port |
| `REDIS_PASSWORD` | redispassword | Redis password |
| `JWT_SECRET` | dev-jwt-secret... | JWT signing key |
| `CORS_ORIGIN` | http://localhost:5173 | Allowed CORS origin |
| `LOG_LEVEL` | debug | Logging level |

### Web Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | http://localhost:3001/api/v1 | API base URL |
| `VITE_WS_URL` | http://localhost:3001 | WebSocket URL |
| `VITE_NODE_ENV` | development | Environment |

## Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check what's using ports
lsof -i :5173  # Web
lsof -i :3001  # API
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Change ports in docker-compose.local.yml if needed
```

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.local.yml ps postgres

# Check database logs
docker-compose -f docker-compose.local.yml logs postgres

# Restart database
docker-compose -f docker-compose.local.yml restart postgres
```

#### API Not Starting

```bash
# Check API logs
docker-compose -f docker-compose.local.yml logs api

# Common issues:
# - Database not ready (wait for health check)
# - Missing environment variables
# - Port already in use
```

#### Web Build Issues

```bash
# Clear node_modules and rebuild
docker-compose -f docker-compose.local.yml down web
docker-compose -f docker-compose.local.yml build --no-cache web
docker-compose -f docker-compose.local.yml up -d web
```

### Clean Reset

```bash
# Stop all services and remove volumes
docker-compose -f docker-compose.local.yml down -v

# Remove all containers and images
docker-compose -f docker-compose.local.yml down --rmi all

# Start fresh
docker-compose -f docker-compose.local.yml up -d
```

## Testing

### Running Tests

```bash
# API tests
docker-compose -f docker-compose.local.yml exec api npm test

# API tests with coverage
docker-compose -f docker-compose.local.yml exec api npm run test:cov

# Web tests
docker-compose -f docker-compose.local.yml exec web npm test

# E2E tests (if configured)
docker-compose -f docker-compose.local.yml exec web npm run test:e2e
```

### Test Database

```bash
# Use separate test database
docker-compose -f docker-compose.local.yml exec api npm run test:db:setup
docker-compose -f docker-compose.local.yml exec api npm run test:db:seed
```

## Production Considerations

This setup is for **development only**. For production:

- Use proper secrets management (AWS Secrets Manager)
- Enable SSL/TLS
- Use production-grade database (Aurora Serverless)
- Implement proper logging and monitoring
- Use container orchestration (ECS, Kubernetes)
- Enable security scanning and updates

## Additional Resources

- [API Documentation](http://localhost:3001/api/docs) (when running)
- [Terraform Infrastructure](../terraform/README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Secrets Management](./SECRETS_MANAGEMENT.md)
