import axios from 'axios'
import {
  Ticket,
  CreateTicketDto,
  UpdateTicketDto,
  User
} from '@service-ticket/types'

interface TicketQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  search?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://3.221.83.148:3001/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Setup axios interceptors for token handling
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage')
  if (token) {
    try {
      const parsed = JSON.parse(token)
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`
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
    console.log(error)
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: { username: string; email: string; password: string; role: string }) =>
    api.post('/auth/register', userData),
}

export const ticketsApi = {
  getTickets: (query?: TicketQueryParams): Promise<{ data: Ticket[]; pagination: any }> =>
    api.get('/tickets', { params: query }),
  getTicket: (id: string): Promise<{ data: Ticket }> =>
    api.get(`/tickets/${id}`),
  createTicket: (data: CreateTicketDto): Promise<{ data: Ticket }> =>
    api.post('/tickets', data),
  updateTicket: (id: string, data: UpdateTicketDto): Promise<{ data: Ticket }> =>
    api.patch(`/tickets/${id}`, data),
  deleteTicket: (id: string) =>
    api.delete(`/tickets/${id}`),
  getMyTickets: (query?: TicketQueryParams): Promise<{ data: Ticket[]; pagination: any }> =>
    api.get('/tickets/my', { params: query }),
  getMyCreatedTickets: (query?: TicketQueryParams): Promise<{ data: Ticket[]; pagination: any }> =>
    api.get('/tickets/my/created', { params: query }),
  approveTicket: (id: string, data: { reason?: string }): Promise<{ data: Ticket }> =>
    api.post(`/tickets/${id}/approve`, data),
}

export const usersApi = {
  getUsers: (): Promise<{ data: User[] }> =>
    api.get('/users'),
  getUser: (id: string): Promise<{ data: User }> =>
    api.get(`/users/${id}`),
  createUser: (data: { username: string; email: string; password: string; role: string }) =>
    api.post('/users', data),
  updateUser: (id: string, data: Partial<{ username: string; email: string; role: string }>) =>
    api.patch(`/users/${id}`, data),
  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),
}


export const aiApi = {
  analyzeTicket: (data: { title: string; description: string }) =>
    api.post('/ai/analyze', data),
  predictSeverity: (data: { title: string; description: string }) =>
    api.post('/ai/predict-severity', data),
  categorizeTicket: (data: { title: string; description: string }) =>
    api.post('/ai/categorize', data),
  analyzeSentiment: (data: { text: string }) =>
    api.post('/ai/sentiment', data),
  suggestResponse: (data: { title: string; description: string }) =>
    api.post('/ai/suggest-response', data),
}

export const csvApi = {
  exportTickets: (options?: {
    status?: string;
    includeResolved?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) => api.post('/csv/export', null, { params: options }),
  downloadCsv: (fileName: string) =>
    api.get(`/csv/download/${fileName}`, { responseType: 'blob' }),
  importTickets: (file: FormData) =>
    api.post('/csv/import', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  scheduleAutomatedProcessing: () =>
    api.post('/csv/schedule-automated-processing'),
  processAutomatedUpdates: () =>
    api.post('/csv/process-automated-updates'),
}

export default api
