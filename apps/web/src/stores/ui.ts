import { create } from 'zustand'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface UIState {
  notifications: Notification[]
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>((set, get) => ({
  notifications: [],
  sidebarOpen: true,
  theme: 'light',

  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    set(state => ({
      notifications: [...state.notifications, newNotification]
    }))

    // Auto remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, notification.duration || 5000)
    }
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  toggleSidebar: () => {
    set(state => ({ sidebarOpen: !state.sidebarOpen }))
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
  },

  setTheme: (theme) => {
    set({ theme })
  }
}))
