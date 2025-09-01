# Development Dockerfile for Web
FROM node:22-slim

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build shared packages first
RUN pnpm --filter @service-ticket/types build
RUN pnpm --filter @service-ticket/config build

# Build the application
RUN pnpm --filter web build

# Production stage with nginx
FROM nginx:alpine
COPY --from=0 /app/apps/web/dist /usr/share/nginx/html
COPY --from=0 /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]