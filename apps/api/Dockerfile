# Development Dockerfile for API
FROM node:22

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Set working directory to API
WORKDIR /app/apps/api

# Expose port
EXPOSE 3001

# Start the application in development mode
CMD ["pnpm", "dev"]