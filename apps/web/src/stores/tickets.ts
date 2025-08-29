import { create } from 'zustand'
import { Ticket, CreateTicketDto, UpdateTicketDto } from '@service-ticket/types'
import axios from 'axios'

interface TicketsState {
  tickets: Ticket[]
  currentTicket: Ticket | null
  loading: boolean
  error: string | null
  filters: {
    status?: string
    priority?: string
    assignedTo?: string
    search?: string
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
  
  // Actions
  fetchTickets: (filters?: any) => Promise<void>
  fetchTicket: (id: string) => Promise<void>
  createTicket: (data: CreateTicketDto) => Promise<Ticket>
  updateTicket: (id: string, data: UpdateTicketDto) => Promise<Ticket>
  deleteTicket: (id: string) => Promise<void>
  setFilters: (filters: any) => void
  clearError: () => void
  setCurrentTicket: (ticket: Ticket | null) => void
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  currentTicket: null,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  },

  fetchTickets: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      const { pagination } = get()
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      }
      
      const response = await axios.get('/api/tickets', { params })
      const { tickets, total } = response.data
      
      set({ 
        tickets, 
        pagination: { ...pagination, total },
        loading: false 
      })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch tickets',
        loading: false 
      })
    }
  },

  fetchTicket: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get(`/api/tickets/${id}`)
      set({ 
        currentTicket: response.data,
        loading: false 
      })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch ticket',
        loading: false 
      })
    }
  },

  createTicket: async (data: CreateTicketDto) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.post('/api/tickets', data)
      const newTicket = response.data
      
      set(state => ({ 
        tickets: [newTicket, ...state.tickets],
        loading: false 
      }))
      
      return newTicket
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create ticket',
        loading: false 
      })
      throw error
    }
  },

  updateTicket: async (id: string, data: UpdateTicketDto) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.patch(`/api/tickets/${id}`, data)
      const updatedTicket = response.data
      
      set(state => ({
        tickets: state.tickets.map(ticket => 
          ticket.id === id ? updatedTicket : ticket
        ),
        currentTicket: state.currentTicket?.id === id ? updatedTicket : state.currentTicket,
        loading: false
      }))
      
      return updatedTicket
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update ticket',
        loading: false 
      })
      throw error
    }
  },

  deleteTicket: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await axios.delete(`/api/tickets/${id}`)
      
      set(state => ({
        tickets: state.tickets.filter(ticket => ticket.id !== id),
        currentTicket: state.currentTicket?.id === id ? null : state.currentTicket,
        loading: false
      }))
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete ticket',
        loading: false 
      })
      throw error
    }
  },

  setFilters: (filters: any) => {
    set({ filters })
  },

  clearError: () => {
    set({ error: null })
  },

  setCurrentTicket: (ticket: Ticket | null) => {
    set({ currentTicket: ticket })
  }
}))
