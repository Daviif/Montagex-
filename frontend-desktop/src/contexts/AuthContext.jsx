import React, { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext({})

const getLoginErrorMessage = (error) => {
  const apiBaseUrl = api.defaults.baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

  if (error.code === 'ECONNABORTED') {
    return `Tempo limite excedido ao conectar em ${apiBaseUrl}. Tente novamente.`
  }

  if (error.response) {
    const status = error.response.status
    const serverMessage =
      error.response.data?.error ||
      error.response.data?.message ||
      error.response.data?.mensagem

    if (serverMessage) {
      return serverMessage
    }

    if (status === 400 || status === 401) {
      return 'Email ou senha inválidos.'
    }

    if (status === 403) {
      return 'Seu usuário não tem permissão para acessar o sistema.'
    }

    if (status >= 500) {
      return 'Erro interno no servidor. Tente novamente em instantes.'
    }

    return `Falha no login (HTTP ${status}).`
  }

  if (error.request) {
    return `Não foi possível conectar ao servidor (${apiBaseUrl}). Verifique se o backend está em execução.`
  }

  return error.message || 'Erro inesperado ao fazer login.'
}

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
      console.error('Erro ao fazer login:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data,
        requestUrl: `${api.defaults.baseURL || ''}/auth/login`
      })

      return {
        success: false,
        message: getLoginErrorMessage(error)
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
