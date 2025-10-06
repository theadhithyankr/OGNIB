'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: { id: string; nickname: string } | null
  loading: boolean
  signIn: (nickname: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem('bingo-user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (nickname: string) => {
    // Generate a simple user ID based on nickname and timestamp
    const userId = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`
    const userData = { id: userId, nickname }
    
    setUser(userData)
    localStorage.setItem('bingo-user', JSON.stringify(userData))
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('bingo-user')
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}