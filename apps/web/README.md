# Web Application

React + Vite frontend for the Service Ticket Management System.

## Features

- **Modern React 18** - Latest React features with TypeScript
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **React Query** - Powerful data fetching and caching
- **React Router** - Client-side routing
- **Real-time Updates** - Socket.io integration for live updates
- **Responsive Design** - Mobile-first responsive interface
- **Form Management** - React Hook Form with Zod validation
- **Toast Notifications** - User feedback with react-hot-toast

## Environment Variables

Copy `.env.example` to `.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
VITE_AI_SERVICE_URL=http://localhost:3002/api/v1
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main application layout
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── Header.tsx      # Top header with user menu
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Authentication state
│   └── SocketContext.tsx # WebSocket connection
├── pages/              # Page components
│   ├── Login.tsx       # Login page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Tickets.tsx     # Tickets list
│   ├── TicketDetail.tsx
│   ├── CreateTicket.tsx
│   └── Users.tsx
├── services/           # API services
│   └── api.ts          # Axios configuration and API calls
├── App.tsx             # Main app component
└── main.tsx            # Application entry point
```

## Key Components

### Authentication
- JWT token-based authentication
- Protected routes with role-based access
- Automatic token refresh and logout

### Real-time Features
- WebSocket connection for live updates
- Real-time ticket status changes
- Instant notifications

### UI/UX
- Clean, modern interface
- Responsive design for all devices
- Loading states and error handling
- Toast notifications for user feedback
