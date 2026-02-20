import { useEffect, useState } from 'react'
import api, { isOfflineError } from '../services/api'

/**
 * Hook para fazer requisições HTTP
 * Gerencia loading, data e erros automaticamente
 * 
 * @param {string} url - URL da requisição
 * @param {string} method - GET, POST, PUT, DELETE
 * @param {object} initialData - Dados iniciais
 * @returns {object} { data, loading, error, refetch, setData }
 */
export const useApi = (url, method = 'GET', initialData = null) => {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = async (payload = null) => {
    try {
      setLoading(true)
      setError(null)

      let response

      if (method === 'GET') {
        response = await api.get(url)
      } else if (method === 'POST') {
        response = await api.post(url, payload)
      } else if (method === 'PUT') {
        response = await api.put(url, payload)
      } else if (method === 'DELETE') {
        response = await api.delete(url)
      }

      setData(response.data.data || response.data)
    } catch (err) {
      if (isOfflineError(err)) {
        setError(err.message || 'Você está offline e não há dados em cache para esta consulta.')
      } else {
        setError(err.response?.data?.message || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (method === 'GET') {
      refetch()
    }
  }, [url, method])

  return { data, loading, error, refetch, setData }
}

export default useApi
