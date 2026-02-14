import React, { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadStorageData = () => {
      const storageUser = localStorage.getItem('@Montagex:user')
      const storageToken = localStorage.getItem('@Montagex:token')

      if (storageUser && storageToken) {
        setUser(JSON.parse(storageUser))
        api.defaults.headers.common['Authorization'] = `Bearer ${storageToken}`
      }

      setLoading(false)
    }

    loadStorageData()
  }, [])

  const signIn = async (email, senha) => {
    try {
      const response = await api.post('/auth/login', { email, senha })
      const { token, usuario } = response.data

      setUser(usuario)
      
      localStorage.setItem('@Montagex:user', JSON.stringify(usuario))
      localStorage.setItem('@Montagex:token', token)
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      navigate('/dashboard')
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      return {
        success: false,
        message: error.response?.data?.error || 'Erro ao fazer login'
      }
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('@Montagex:user')
    localStorage.removeItem('@Montagex:token')
    delete api.defaults.headers.common['Authorization']
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{
      signed: !!user,
      user,
      loading,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
}

export { AuthContext }

export default AuthContext
