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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

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
    // if (error.response?.status === 401) {
    //   localStorage.removeItem('auth-storage')
    //   window.location.href = '/login'
    // }
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
  getTickets: (query?: TicketQuery): Promise<PaginatedResponse<Ticket>> =>
    api.get('/tickets', { params: query }).then(response => response.data.data),
  getTicket: (id: string): Promise<{ data: Ticket }> =>
    api.get(`/tickets/${id}`),
  createTicket: (data: CreateTicketDto): Promise<{ data: Ticket }> =>
    api.post('/tickets', data),
  updateTicket: (id: string, data: UpdateTicketDto): Promise<{ data: Ticket }> =>
    api.patch(`/tickets/${id}`, data),
  deleteTicket: (id: string, reason?: string) =>
    api.delete(`/tickets/${id}`, { data: { reason } }),
  getTicketHistory: (id: string) =>
    api.get(`/tickets/${id}/history`),
  getMyAssignedTickets: (query?: TicketQuery) =>
    api.get('/tickets/my/assigned', { params: query }),
  getMyCreatedTickets: (query?: TicketQuery) =>
    api.get('/tickets/my/created', { params: query }),
}

// Note: Comments endpoints not implemented in backend yet
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
  createUser: (data: { username: string; email: string; password: string; role: string }) =>
    api.post('/users', data),
  updateUser: (id: string, data: Partial<{ username: string; email: string; role: string }>) =>
    api.patch(`/users/${id}`, data),
  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),
}

// Note: Dashboard stats endpoint not implemented in backend yet
export const dashboardApi = {
  getStats: () =>
    api.get('/dashboard/stats'),
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
