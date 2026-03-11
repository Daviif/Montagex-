import axios from 'axios'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL
const configuredWsUrl = import.meta.env.VITE_WS_URL
const CACHE_PREFIX = '@Montagex:api-cache:'
const CACHE_TTL_MS = 1000 * 60 * 30
const OFFLINE_QUEUE_KEY = '@Montagex:offline-queue'
const OFFLINE_QUEUE_EVENT = 'montagex:offline-queue-updated'

let isSyncingOfflineQueue = false
let lastOfflineSyncAt = null
let lastOfflineSyncError = null

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

const rawApi = axios.create({
  baseURL: getDefaultApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const wsBaseURL = getDefaultWsUrl()

const getCacheKey = (config) => {
  const method = (config.method || 'get').toLowerCase()
  const url = `${config.baseURL || ''}${config.url || ''}`
  const params = config.params ? JSON.stringify(config.params) : ''
  return `${CACHE_PREFIX}${method}:${url}?${params}`
}

const readCachedResponse = (cacheKey) => {
  if (typeof localStorage === 'undefined') {
    return null
  }

  const raw = localStorage.getItem(cacheKey)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.cachedAt || Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey)
      return null
    }

    return parsed.data
  } catch {
    localStorage.removeItem(cacheKey)
    return null
  }
}

const writeCachedResponse = (cacheKey, data) => {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      cachedAt: Date.now(),
      data
    }))
  } catch {
    // Ignora erro de quota/storage indisponível
  }
}

const buildCachedAxiosResponse = (config, data, cacheState) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {
    'x-montagex-cache': cacheState
  },
  config,
  request: {
    fromCache: true
  }
})

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

const isNetworkError = (error) => {
  if (error.response) {
    return false
  }

  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK' ||
    error.message === 'Network Error' ||
    error.isOffline
  )
}

const loadOfflineQueue = () => {
  if (typeof localStorage === 'undefined') {
    return []
  }

  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveOfflineQueue = (queue) => {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

const dispatchOfflineQueueUpdate = () => {
  if (typeof window === 'undefined') {
    return
  }

  const queue = loadOfflineQueue()
  window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_EVENT, {
    detail: {
      pending: queue.length,
      isSyncing: isSyncingOfflineQueue,
      lastSyncAt: lastOfflineSyncAt,
      lastError: lastOfflineSyncError
    }
  }))
}

const enqueueOfflineMutation = (config) => {
  const queue = loadOfflineQueue()
  const queueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    method: (config.method || 'post').toLowerCase(),
    url: config.url,
    baseURL: config.baseURL,
    data: config.data,
    params: config.params,
    headers: {
      'Content-Type': config.headers?.['Content-Type'] || config.headers?.['content-type'] || 'application/json'
    },
    createdAt: Date.now(),
    retries: 0
  }

  queue.push(queueItem)
  saveOfflineQueue(queue)
  dispatchOfflineQueueUpdate()
  return queueItem
}

const getOfflineQueueStatus = () => {
  const queue = loadOfflineQueue()
  return {
    pending: queue.length,
    isSyncing: isSyncingOfflineQueue,
    lastSyncAt: lastOfflineSyncAt,
    lastError: lastOfflineSyncError
  }
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('@Montagex:token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const syncOfflineQueue = async () => {
  if (isSyncingOfflineQueue || isOffline()) {
    return
  }

  const queue = loadOfflineQueue()
  if (!queue.length) {
    lastOfflineSyncError = null
    dispatchOfflineQueueUpdate()
    return
  }

  isSyncingOfflineQueue = true
  lastOfflineSyncError = null
  dispatchOfflineQueueUpdate()

  const remaining = [...queue]

  try {
    while (remaining.length) {
      const item = remaining[0]

      await rawApi.request({
        method: item.method,
        url: item.url,
        baseURL: item.baseURL || api.defaults.baseURL,
        data: item.data,
        params: item.params,
        headers: {
          ...item.headers,
          ...getAuthHeaders()
        }
      })

      remaining.shift()
      saveOfflineQueue(remaining)
      dispatchOfflineQueueUpdate()
    }

    lastOfflineSyncAt = Date.now()
    lastOfflineSyncError = null
  } catch (error) {
    if (remaining[0]) {
      remaining[0].retries = (remaining[0].retries || 0) + 1
      saveOfflineQueue(remaining)
    }

    lastOfflineSyncError = error.message || 'Falha ao sincronizar fila offline.'
  } finally {
    isSyncingOfflineQueue = false
    dispatchOfflineQueueUpdate()
  }
}

export const isOfflineError = (error) => {
  return Boolean(
    error?.isOffline ||
    error?.code === 'OFFLINE_NO_CACHE' ||
    error?.code === 'OFFLINE_MUTATION_BLOCKED' ||
    error?.code === 'OFFLINE_MUTATION_QUEUED'
  )
}

export { getOfflineQueueStatus, OFFLINE_QUEUE_EVENT }

// Interceptor para adicionar o token automaticamente
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('@Montagex:token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const method = (config.method || 'get').toLowerCase()

    if (method !== 'get' && isOffline()) {
      enqueueOfflineMutation(config)
      const offlineMutationError = new Error('Você está offline. A operação foi salva na fila e será sincronizada automaticamente.')
      offlineMutationError.code = 'OFFLINE_MUTATION_QUEUED'
      offlineMutationError.isOffline = true
      return Promise.reject(offlineMutationError)
    }

    if (method === 'get') {
      const cacheKey = getCacheKey(config)
      config.metadata = {
        ...(config.metadata || {}),
        cacheKey
      }

      if (isOffline()) {
        const cachedData = readCachedResponse(cacheKey)

        if (cachedData !== null) {
          config.adapter = async () => buildCachedAxiosResponse(config, cachedData, 'HIT-OFFLINE')
        } else {
          const offlineNoCacheError = new Error('Você está offline e não há dados em cache para esta tela.')
          offlineNoCacheError.code = 'OFFLINE_NO_CACHE'
          offlineNoCacheError.isOffline = true
          return Promise.reject(offlineNoCacheError)
        }
      }
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  response => {
    const method = (response.config?.method || 'get').toLowerCase()
    const cacheKey = response.config?.metadata?.cacheKey

    if (method === 'get' && cacheKey) {
      writeCachedResponse(cacheKey, response.data)
    }

    return response
  },
  error => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('@Montagex:token')
      localStorage.removeItem('@Montagex:user')
      window.location.href = '/login'
    }

    const method = (error.config?.method || 'get').toLowerCase()
    const cacheKey = error.config?.metadata?.cacheKey || (error.config ? getCacheKey(error.config) : null)

    if (method !== 'get' && error.config && isNetworkError(error)) {
      enqueueOfflineMutation(error.config)

      const queuedError = new Error('Falha de conexão. A operação foi adicionada à fila offline para sincronização.')
      queuedError.code = 'OFFLINE_MUTATION_QUEUED'
      queuedError.isOffline = true

      return Promise.reject(queuedError)
    }

    if (method === 'get' && cacheKey && isNetworkError(error)) {
      const cachedData = readCachedResponse(cacheKey)
      if (cachedData !== null) {
        return Promise.resolve(buildCachedAxiosResponse(error.config, cachedData, 'STALE-FALLBACK'))
      }
    }

    return Promise.reject(error)
  }
)

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineQueue()
  })

  setTimeout(() => {
    dispatchOfflineQueueUpdate()
    if (!isOffline()) {
      syncOfflineQueue()
    }
  }, 0)
}

export default api
