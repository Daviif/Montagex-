import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar o token automaticamente
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('@Montagex:token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('@Montagex:token')
      localStorage.removeItem('@Montagex:user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
