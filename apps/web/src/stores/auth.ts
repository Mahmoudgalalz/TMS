import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@service-ticket/types'
import { api } from '@/services/api'

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
          const response = await api.post('/auth/login', { email, password })
          const { user, access_token } = response.data
          
          set({ 
            user, 
            token: access_token, 
            isAuthenticated: true, 
            isLoading: false 
          })
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
        // Token will be cleared automatically by interceptor
      },

      refreshToken: async () => {
        const { token } = get()
        if (!token) return

        try {
          const response = await api.post('/auth/refresh')
          const { access_token } = response.data
          
          set({ token: access_token })
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
      onRehydrateStorage: () => (state) => {
        if (state?.token && state?.user) {
          state.isAuthenticated = true
        }
      },
    }
  )
)
