# Service Ticket Management System

A comprehensive service ticket management system built with Turborepo, featuring a modern tech stack with AI-powered automation.

Access the API
http://13.220.175.148:3001/api/v1
API Docs 
http://13.220.175.148:3001/api/docs

Dashboard
http://ec2-3-82-235-216.compute-1.amazonaws.com
## 🏗️ Architecture

This project uses a **Turborepo monorepo** structure with the following applications and packages:

### Applications
- **`apps/api`** - NestJS backend API service
- **`apps/web`** - React + Vite frontend application  
- **`apps/ai-service`** - NestJS AI microservice for ticket analysis

### Shared Packages
- **`packages/types`** - Shared TypeScript types and interfaces
- **`packages/config`** - Shared configuration files and constants

## 🚀 Tech Stack

### Backend (API)
- **NestJS** - Progressive Node.js framework
- **TypeORM** - Object-Relational Mapping
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **JWT** - Authentication
- **WebSocket** - Real-time communication
- **Swagger** - API documentation

### Frontend (Web)
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time updates

### AI Service
- **NestJS** - Microservice framework
- **LangChain** - AI/ML integration framework
- **Cloudflare Workers AI** - AI processing (configurable)

### Development Tools
- **Turborepo** - Monorepo build system
- **pnpm** - Package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** >= 13
- **Redis** >= 6.0 (optional, for caching)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd service-ticket-management
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   cp apps/ai-service/.env.example apps/ai-service/.env
   
   # Edit the .env files with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb service_tickets
   
   # The API will automatically run migrations on startup
   ```

## 🏃‍♂️ Development

### Start all services
```bash
pnpm dev
```

This will start:
- API server on `http://localhost:3000`
- Web application on `http://localhost:5173`
- AI service on `http://localhost:3002`

### Start individual services
```bash
# API only
pnpm dev:api

# Web only  
pnpm dev:web

# AI service only
pnpm dev:ai
```

### Other commands
```bash
# Build all applications
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Format code
pnpm format

# Clean build artifacts
pnpm clean
```

## 📚 API Documentation

Once the API server is running, you can access:
- **API Documentation**: `http://localhost:3000/api/docs`
- **AI Service Documentation**: `http://localhost:3002/api/docs`

## 🔧 Configuration

### Database Configuration
The system uses PostgreSQL as the primary database. Configure connection details in `apps/api/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=service_tickets
```

### AI Integration
The AI service can be configured to use Cloudflare Workers AI. Set up your credentials in `apps/ai-service/.env`:

```env
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

## 🏢 Features

### Core Features
- ✅ **User Management** - Role-based access control (Admin, Agent, User)
- ✅ **Ticket Management** - Create, update, assign, and track tickets
- ✅ **Real-time Updates** - WebSocket-powered live updates
- ✅ **File Attachments** - Upload and manage ticket attachments
- ✅ **Comments System** - Internal and external comments
- ✅ **Dashboard Analytics** - Ticket statistics and insights

### AI-Powered Features
- 🤖 **Sentiment Analysis** - Automatic ticket sentiment detection
- 🎯 **Smart Categorization** - AI-suggested ticket categories
- ⚡ **Priority Scoring** - Intelligent priority recommendations
- 💬 **Response Suggestions** - AI-generated response templates
- 🔍 **Topic Extraction** - Key topic identification

### Advanced Features
- 🔐 **JWT Authentication** - Secure token-based auth
- 📊 **Advanced Filtering** - Filter tickets by status, priority, category
- 🔄 **Real-time Notifications** - Instant updates via WebSocket
- 📱 **Responsive Design** - Mobile-friendly interface
- 🎨 **Modern UI** - Clean, intuitive user experience

## 🗂️ Project Structure

```
service-ticket-management/
├── apps/
│   ├── api/                 # NestJS API service
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules
│   │   │   ├── main.ts      # Application entry point
│   │   │   └── app.module.ts
│   │   └── package.json
│   ├── web/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/  # Reusable components
│   │   │   ├── pages/       # Page components
│   │   │   ├── contexts/    # React contexts
│   │   │   └── services/    # API services
│   │   └── package.json
│   └── ai-service/          # AI microservice
│       ├── src/
│       │   └── modules/
│       └── package.json
├── packages/
│   ├── types/               # Shared TypeScript types
│   └── config/              # Shared configuration
├── package.json             # Root package.json
├── turbo.json              # Turborepo configuration
└── pnpm-workspace.yaml     # pnpm workspace config
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mahmoud Galal**

---

## ☁️ AWS Deployment

This project includes a complete AWS deployment infrastructure using Terraform with auto-scaling to zero capabilities for cost optimization.

### Infrastructure Components

- **ECS Fargate** - Containerized applications with auto-scaling to zero
- **Aurora Serverless v2** - PostgreSQL database with auto-pause
- **ElastiCache Redis** - Caching layer
- **Application Load Balancer** - Traffic distribution
- **S3 + CloudFront** - Static frontend hosting
- **ECR** - Container registries
- **CodeBuild/CodePipeline** - CI/CD automation
- **CloudWatch** - Monitoring and logging

### Quick Deployment

1. **Prerequisites Setup**
   ```bash
   # Make scripts executable
   chmod +x scripts/*.sh
   
   # Run initial setup
   ./scripts/setup.sh
   ```

2. **Configure Environment**
   ```bash
   # Copy and edit environment variables
   cp .env.example .env
   # Fill in your AWS credentials and secrets
   ```

3. **Deploy Infrastructure**
   ```bash
   # Initialize Terraform
   ./scripts/deploy.sh dev init
   
   # Plan deployment
   ./scripts/deploy.sh dev plan
   
   # Apply deployment
   ./scripts/deploy.sh dev apply
   ```

### Auto-Scaling to Zero Features

- **ECS Services**: Scale down to 0 tasks during inactivity
- **Aurora Serverless v2**: Auto-pause after 5 minutes of inactivity (0.5 ACU minimum)
- **Aggressive scaling policies**: Fast scale-down with 30-second deregistration delay
- **Cost monitoring**: CloudWatch cost anomaly detection

### Environment Management

- **Development**: `./scripts/deploy.sh dev [action]`
- **Production**: `./scripts/deploy.sh prod [action]`

Available actions: `init`, `plan`, `apply`, `destroy`, `validate`

### Infrastructure Modules

```
terraform/
├── main.tf                 # Main configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── modules/
│   ├── networking/         # VPC, subnets, security groups
│   ├── database/           # Aurora Serverless v2
│   ├── cache/              # ElastiCache Redis
│   ├── ecs/                # ECS Fargate cluster
│   ├── alb/                # Application Load Balancer
│   ├── ecr/                # Container registries
│   ├── s3/                 # Frontend hosting
│   ├── codebuild/          # CI/CD pipeline
│   └── monitoring/         # CloudWatch resources
└── environments/
    ├── dev/                # Development configuration
    └── prod/               # Production configuration
```

### Cost Optimization

- **Auto-scaling to zero** for all compute resources
- **Spot instances** where applicable
- **Lifecycle policies** for ECR and S3
- **Cost anomaly detection** with email alerts
- **Resource tagging** for cost allocation

## 🚨 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9  # API
lsof -ti:5173 | xargs kill -9  # Web
lsof -ti:3002 | xargs kill -9  # AI Service
```

**Database connection issues**
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if the database exists

**Build failures**
```bash
# Clean and reinstall dependencies
pnpm clean
rm -rf node_modules
pnpm install
```

**AWS Deployment Issues**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Validate Terraform configuration
./scripts/deploy.sh dev validate

# View deployment logs
aws logs describe-log-groups --log-group-name-prefix "/ecs/service-ticket-system"
```

For more help, please open an issue on GitHub.
