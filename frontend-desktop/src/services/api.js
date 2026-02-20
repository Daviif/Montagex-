import axios from 'axios'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL
const configuredWsUrl = import.meta.env.VITE_WS_URL

const getDefaultApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    if (!configuredApiBaseUrl || configuredApiBaseUrl.includes('.app.github.dev')) {
      return '/api'
    }

    return configuredApiBaseUrl
  }

  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    const codespacesMatch = hostname.match(/^(.*)-\d+\.app\.github\.dev$/)

    if (codespacesMatch?.[1]) {
      return `${protocol}//${codespacesMatch[1]}-3000.app.github.dev/api`
    }
  }

  return 'http://localhost:3000/api'
}

const getDefaultWsUrl = () => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    if (!configuredWsUrl || configuredWsUrl.includes('.app.github.dev')) {
      return window.location.origin
    }

    return configuredWsUrl
  }

  if (configuredWsUrl) {
    return configuredWsUrl
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    const codespacesMatch = hostname.match(/^(.*)-\d+\.app\.github\.dev$/)

    if (codespacesMatch?.[1]) {
      return `${protocol}//${codespacesMatch[1]}-3000.app.github.dev`
    }
  }

  return 'http://localhost:3000'
}

const api = axios.create({
  baseURL: getDefaultApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const wsBaseURL = getDefaultWsUrl()

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
