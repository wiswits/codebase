import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from '../services/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/v1/auth/profile')
      setUser(response.data.data)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('token')
      setToken(null)
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, orgId) => {
    try {
      console.log('Login attempt:', { email, orgId })
      
      const response = await axios.post('/v1/auth/login', {
        email,
        password,
        orgId: parseInt(orgId)
      })

      console.log('Login response:', response.data)

      if (response.data.success) {
        const { token, user } = response.data.data
        localStorage.setItem('token', token)
        setToken(token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(user)
        toast.success('Welcome back!')
        return { success: true }
      } else {
        toast.error(response.data.error || 'Login failed')
        return { success: false, error: response.data.error }
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message)
      const message = error.response?.data?.error || 'Login failed. Please try again.'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}