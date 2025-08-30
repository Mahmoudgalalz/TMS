# Development Dockerfile for API
FROM node:22

# Install PostgreSQL client and pnpm globally
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.6.10

# Set working directory
WORKDIR /app

# Copy package files from root context
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install

# Copy API source code
COPY apps/api/src/ ./apps/api/src/
COPY apps/api/drizzle.config.ts apps/api/tsconfig.json ./apps/api/
COPY apps/api/script.sh ./apps/api/

# Copy turbo.json for monorepo support
COPY turbo.json ./

# Make script executable
RUN chmod +x /app/apps/api/script.sh

# Create necessary directories
RUN mkdir -p /app/apps/api/uploads /app/apps/api/logs

# Expose port
EXPOSE 3001

# Start the application in development mode
ENTRYPOINT ["/app/apps/api/script.sh"]