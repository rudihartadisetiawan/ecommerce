'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const dummyUser = { name: 'Rara Anindya', email: 'rara@gaul.com', phone: '081234567890' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('gaul-auth')
    setUser(stored ? JSON.parse(stored) : null)
    setLoaded(true)
  }, [])

  const login = (email, password) => {
    setUser(dummyUser)
    localStorage.setItem('gaul-auth', JSON.stringify(dummyUser))
  }

  const register = (data) => {
    setUser({ ...dummyUser, ...data })
    localStorage.setItem('gaul-auth', JSON.stringify({ ...dummyUser, ...data }))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('gaul-auth')
  }

  const updateProfile = (data) => {
    const updated = { ...user, ...data }
    setUser(updated)
    localStorage.setItem('gaul-auth', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, loaded, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
