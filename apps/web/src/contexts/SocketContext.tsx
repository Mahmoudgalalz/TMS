import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:3000')
      
      newSocket.on('connect', () => {
        setConnected(true)
        newSocket.emit('join', { userId: user.id })
      })

      newSocket.on('disconnect', () => {
        setConnected(false)
      })

      newSocket.on('notification', (notification) => {
        toast(notification.message, { 
          icon: notification.type === 'error' ? '❌' : '📢' 
        })
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user])

  const value = {
    socket,
    connected,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
