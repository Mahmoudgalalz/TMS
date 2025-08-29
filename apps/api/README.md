# Service Ticket Management API

Backend API for the Service Ticket Management System built with NestJS and Drizzle ORM.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Associate, Manager)
- **Ticket Management**: Complete CRUD operations with business logic and status transitions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Queue System**: Redis-powered background job processing with Bull/BullMQ
- **CSV Operations**: Export/import tickets with automated processing
- **AI Integration**: Ticket analysis, severity prediction, and response suggestions
- **Real-time Updates**: WebSocket support for live notifications
- **Audit Trail**: Complete ticket history tracking
- **API Documentation**: Swagger/OpenAPI documentation

## 🛠 Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Drizzle ORM
- **Cache/Queue**: Redis with Bull/BullMQ
- **Authentication**: JWT with Passport
- **Validation**: Zod schemas with class-validator
- **Documentation**: Swagger/OpenAPI
- **File Processing**: Multer for uploads, CSV parsing/generation

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=service_tickets

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Application
PORT=3000
NODE_ENV=development
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration

### Tickets
- `GET /api/v1/tickets` - List tickets with filtering
- `POST /api/v1/tickets` - Create new ticket
- `GET /api/v1/tickets/:id` - Get ticket details
- `PATCH /api/v1/tickets/:id` - Update ticket
- `DELETE /api/v1/tickets/:id` - Delete ticket

### Comments
- `GET /api/v1/tickets/:id/comments` - Get ticket comments
- `POST /api/v1/tickets/:id/comments` - Add comment to ticket

### Users
- `GET /api/v1/users` - List users (Admin only)
- `GET /api/v1/users/:id` - Get user details
- `PATCH /api/v1/users/:id` - Update user

## Database Schema

The API uses TypeORM with PostgreSQL. Key entities:

- **User** - System users with roles
- **Ticket** - Service tickets with status, priority, etc.
- **Comment** - Comments on tickets
- **Attachment** - File attachments for tickets

## WebSocket Events

- `ticket_updated` - Ticket status/details changed
- `comment_added` - New comment added to ticket
- `notification` - User notifications
