import { useCallback } from 'react'

/**
 * Hook para formatar valores monetários
 * 
 * @returns {function} Função para formatar currency
 */
export const useCurrency = () => {
  return useCallback((value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }, [])
}

/**
 * Hook para formatar datas
 * 
 * @returns {object} Funções de formatação
 */
export const useDate = () => {
  const formatDate = useCallback((date, format = 'dd/MM/yyyy') => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')

    const formats = {
      'dd/MM/yyyy': `${day}/${month}/${year}`,
      'yyyy-MM-dd': `${year}-${month}-${day}`,
      'dd/MM/yyyy HH:mm': `${day}/${month}/${year} ${hour}:${minute}`
    }

    return formats[format] || formats['dd/MM/yyyy']
  }, [])

  return { formatDate }
}

export default { useCurrency, useDate }
