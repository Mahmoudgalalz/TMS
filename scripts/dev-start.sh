#!/bin/bash

# Development Environment Startup Script
# This script helps you quickly start the local development environment

set -e

echo "🚀 Starting Service Ticket Management System - Development Environment"
echo "=================================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local - you can edit it to customize your environment"
fi

# Create API .env if it doesn't exist
if [ ! -f apps/api/.env ]; then
    echo "📝 Creating API .env from template..."
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created apps/api/.env"
fi

# Create Web .env if it doesn't exist
if [ ! -f apps/web/.env ]; then
    echo "📝 Creating Web .env from template..."
    cp apps/web/.env.example apps/web/.env
    echo "✅ Created apps/web/.env"
fi

# Function to check if services are healthy
check_health() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.local.yml ps $service | grep -q "healthy"; then
            echo "✅ $service is healthy"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ $service failed to become healthy after $max_attempts attempts"
            return 1
        fi
        
        echo "   Attempt $attempt/$max_attempts - waiting..."
        sleep 2
        ((attempt++))
    done
}

# Parse command line arguments
PROFILE=""
DETACHED=false
TOOLS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --tools)
            TOOLS=true
            PROFILE="--profile tools"
            shift
            ;;
        -d|--detach)
            DETACHED=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --tools     Start with admin tools (pgAdmin, Redis Commander)"
            echo "  -d, --detach    Run in detached mode"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Services:"
            echo "  - Web (React):     http://localhost:5173"
            echo "  - API (NestJS):    http://localhost:3001"
            echo "  - API Docs:        http://localhost:3001/api/docs"
            echo "  - PostgreSQL:      localhost:5432"
            echo "  - Redis:           localhost:6379"
            echo ""
            if [ "$TOOLS" = true ]; then
                echo "Admin Tools (with --tools):"
                echo "  - pgAdmin:         http://localhost:8080 (admin@example.com / admin)"
                echo "  - Redis Commander: http://localhost:8081 (admin / admin)"
            fi
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Start services
echo "🐳 Starting Docker services..."
if [ "$DETACHED" = true ]; then
    docker-compose -f docker-compose.local.yml $PROFILE up -d
else
    echo "💡 Tip: Use Ctrl+C to stop services, or run with -d flag for detached mode"
    echo ""
    docker-compose -f docker-compose.local.yml $PROFILE up
fi

# If running in detached mode, show status and URLs
if [ "$DETACHED" = true ]; then
    echo ""
    echo "🎉 Services started successfully!"
    echo ""
    echo "📊 Service Status:"
    docker-compose -f docker-compose.local.yml ps
    echo ""
    echo "🌐 Access URLs:"
    echo "  • Web Application:    http://localhost:5173"
    echo "  • API:               http://localhost:3001"
    echo "  • API Documentation: http://localhost:3001/api/docs"
    echo "  • API Health Check:  http://localhost:3001/health"
    
    if [ "$TOOLS" = true ]; then
        echo ""
        echo "🛠️  Admin Tools:"
        echo "  • pgAdmin:           http://localhost:8080 (admin@example.com / admin)"
        echo "  • Redis Commander:   http://localhost:8081 (admin / admin)"
    fi
    
    echo ""
    echo "📝 Useful Commands:"
    echo "  • View logs:         docker-compose -f docker-compose.local.yml logs -f"
    echo "  • Stop services:     docker-compose -f docker-compose.local.yml down"
    echo "  • Restart service:   docker-compose -f docker-compose.local.yml restart <service>"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  • Check service logs if something isn't working"
    echo "  • Ensure ports 5173, 3001, 5432, 6379 are not in use by other applications"
    echo "  • Run 'docker-compose -f docker-compose.local.yml down -v' to reset volumes"
fi
