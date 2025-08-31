import { create } from 'zustand'
import { User } from '@service-ticket/types'
import { usersApi } from '../services/api'

interface UsersState {
  users: User[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchUsers: () => Promise<void>
  createUser: (userData: { username: string; email: string; password: string; role: string }) => Promise<User>
  updateUser: (id: string, userData: Partial<{ username: string; email: string; role: string }>) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    try {
      set({ loading: true, error: null })
      const response = await usersApi.getUsers()
      set({ users: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch users',
        loading: false 
      })
    }
  },

  createUser: async (userData) => {
    try {
      set({ loading: true, error: null })
      const response = await usersApi.createUser(userData)
      const newUser = response.data
      
      set(state => ({ 
        users: [...state.users, newUser],
        loading: false 
      }))
      
      return newUser
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create user',
        loading: false 
      })
      throw error
    }
  },

  updateUser: async (id, userData) => {
    try {
      set({ loading: true, error: null })
      const response = await usersApi.updateUser(id, userData)
      const updatedUser = response.data
      
      set(state => ({
        users: state.users.map(user => 
          user.id === id ? updatedUser : user
        ),
        loading: false
      }))
      
      return updatedUser
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update user',
        loading: false 
      })
      throw error
    }
  },

  deleteUser: async (id) => {
    try {
      set({ loading: true, error: null })
      await usersApi.deleteUser(id)
      
      set(state => ({
        users: state.users.filter(user => user.id !== id),
        loading: false
      }))
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete user',
        loading: false 
      })
      throw error
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
