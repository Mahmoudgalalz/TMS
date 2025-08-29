import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import CreateTicket from './pages/CreateTicket'
import Users from './pages/Users'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="tickets/new" element={<CreateTicket />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Routes>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
