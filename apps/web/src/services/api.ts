import axios from 'axios'
import { 
  CreateTicketDto, 
  UpdateTicketDto, 
  CreateCommentDto, 
  TicketQuery,
  PaginatedResponse,
  Ticket,
  User,
  Comment
} from '@service-ticket/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage')
  if (token) {
    try {
      const authData = JSON.parse(token)
      if (authData.state?.token) {
        config.headers.Authorization = `Bearer ${authData.state.token}`
      }
    } catch (error) {
      console.error('Error parsing auth token:', error)
    }
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: any) =>
    api.post('/auth/register', userData),
}

export const ticketsApi = {
  getTickets: (query?: TicketQuery): Promise<{ data: PaginatedResponse<Ticket> }> =>
    api.get('/tickets', { params: query }),
  getTicket: (id: string): Promise<{ data: Ticket }> =>
    api.get(`/tickets/${id}`),
  createTicket: (data: CreateTicketDto): Promise<{ data: Ticket }> =>
    api.post('/tickets', data),
  updateTicket: (id: string, data: UpdateTicketDto): Promise<{ data: Ticket }> =>
    api.patch(`/tickets/${id}`, data),
  deleteTicket: (id: string) =>
    api.delete(`/tickets/${id}`),
}

export const commentsApi = {
  getComments: (ticketId: string): Promise<{ data: Comment[] }> =>
    api.get(`/tickets/${ticketId}/comments`),
  createComment: (ticketId: string, data: CreateCommentDto): Promise<{ data: Comment }> =>
    api.post(`/tickets/${ticketId}/comments`, data),
  updateComment: (commentId: string, data: Partial<CreateCommentDto>) =>
    api.patch(`/comments/${commentId}`, data),
  deleteComment: (commentId: string) =>
    api.delete(`/comments/${commentId}`),
}

export const usersApi = {
  getUsers: (): Promise<{ data: User[] }> =>
    api.get('/users'),
  getUser: (id: string): Promise<{ data: User }> =>
    api.get(`/users/${id}`),
  updateUser: (id: string, data: any) =>
    api.patch(`/users/${id}`, data),
}

export const dashboardApi = {
  getStats: () =>
    api.get('/dashboard/stats'),
}

export default api
