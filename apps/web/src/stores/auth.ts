import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { User } from '@service-ticket/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await axios.post('/api/auth/login', { email, password })
          const { user, token } = response.data
          
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          })
          
          // Set default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        })
        delete axios.defaults.headers.common['Authorization']
      },

      refreshToken: async () => {
        const { token } = get()
        if (!token) return

        try {
          const response = await axios.post('/api/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const { token: newToken } = response.data
          
          set({ token: newToken })
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        } catch (error) {
          get().logout()
          throw error
        }
      },

      setUser: (user: User) => {
        set({ user })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
