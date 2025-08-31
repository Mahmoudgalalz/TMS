import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TicketList from './components/tickets/TicketList'
import TicketForm from './components/tickets/TicketForm'
import TicketDetail from './pages/TicketDetail'
import CSVExport from './pages/CSVExport'
import CSVImport from './pages/CSVImport'
import Analytics from './pages/Analytics'
import Users from './pages/Users'
import ProtectedRoute from './components/ProtectedRoute'
import NotificationSystem from './components/NotificationSystem'


function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/new" element={<TicketForm />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="tickets/:id/edit" element={<TicketForm />} />
          <Route path="csv/export" element={<CSVExport />} />
          <Route path="csv/import" element={<CSVImport />} />
          <Route path="users" element={<Users />} />
          <Route path="users/new" element={<Users />} />
          <Route path="users/:id/edit" element={<Users />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
      <NotificationSystem />
      <Toaster position="top-right" />
    </>
  )
}

export default App
