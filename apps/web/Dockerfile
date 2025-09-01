# Development Dockerfile for Web
FROM node:22-slim

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Set working directory
WORKDIR /app

# Copy package files from root context
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter @service-ticket/types build
RUN pnpm --filter @service-ticket/config build

# Copy web source code
COPY apps/web/src/ ./apps/web/src/
COPY apps/web/public ./apps/web/public/
COPY apps/web/*.json apps/web/*.js apps/web/*.ts apps/web/*.html apps/web/nginx.conf ./apps/web/

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