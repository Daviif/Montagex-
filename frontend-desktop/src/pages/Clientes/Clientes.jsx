import React, { useMemo, useState } from 'react'
import {
  MdAdd,
  MdClose,
  MdDelete,
  MdEdit,
  MdPerson,
  MdSearch,
  MdStore
} from 'react-icons/md'
import Card from '../../components/Card/Card'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../hooks/useApi'
import api from '../../services/api'
import './Clientes.css'

/**
 * Página de clientes (lojas e particulares).
 *
 * @returns {JSX.Element}
 */
const Clientes = () => {
  const [activeTab, setActiveTab] = useState('lojas')
  const [lojaSearch, setLojaSearch] = useState('')
  const [particularSearch, setParticularSearch] = useState('')
  const [isLojaModalOpen, setIsLojaModalOpen] = useState(false)
  const [isParticularModalOpen, setIsParticularModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionError, setActionError] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [isLookupLoading, setIsLookupLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [lojaForm, setLojaForm] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    telefone: '',
    email: '',
    endereco: '',
    prazo_pagamento_dias: '',
    usa_porcentagem: false,
    porcentagem_repasse: '',
    observacoes_pagamento: ''
  })
  const [particularForm, setParticularForm] = useState({
    nome: '',
    telefone: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_complemento: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado: '',
    endereco_cep: ''
  })

  const {
    data: lojas,
    loading: lojasLoading,
    error: lojasError,
    refetch: refetchLojas
  } = useApi('/lojas', 'GET', [])

  const {
    data: particulares,
    loading: particularesLoading,
    error: particularesError,
    refetch: refetchParticulares
  } = useApi('/clientes_particulares', 'GET', [])

  const { user } = useAuth()
  const isAdmin = user?.tipo === 'admin'

  // Função para formatar CEP
  const formatCep = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 5) {
      return cleaned
    }
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`
  }

  // Função para formatar telefone
  const formatTelefone = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      return cleaned
    }
    if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    }
    if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`
    }
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
  }

  // Função para formatar estado (UF)
  const formatEstado = (value) => {
    return value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2)
  }

  const lojasList = useMemo(
    () => (Array.isArray(lojas) ? lojas : []),
    [lojas]
  )

  const particularesList = useMemo(
    () => (Array.isArray(particulares) ? particulares : []),
    [particulares]
  )

  const filteredLojas = useMemo(() => {
    const normalizedSearch = lojaSearch.trim().toLowerCase()

    return lojasList.filter((loja) => {
      if (!normalizedSearch) return true
      return (
        loja.nome?.toLowerCase().includes(normalizedSearch)
        || loja.email?.toLowerCase().includes(normalizedSearch)
        || loja.cnpj?.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [lojasList, lojaSearch])

  const filteredParticulares = useMemo(() => {
    const normalizedSearch = particularSearch.trim().toLowerCase()

    return particularesList.filter((cliente) => {
      if (!normalizedSearch) return true
      return (
        cliente.nome?.toLowerCase().includes(normalizedSearch)
        || cliente.telefone?.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [particularesList, particularSearch])

  const isLoading = lojasLoading || particularesLoading
  const errorMessage = lojasError || particularesError

  const openLojaModal = (loja = null) => {
    setActionError('')
    setEditingItem(loja)
    setLojaForm({
      nome: loja?.nome || '',
      cnpj: loja?.cnpj || '',
      razao_social: loja?.razao_social || '',
      nome_fantasia: loja?.nome_fantasia || '',
      telefone: loja?.telefone || '',
      email: loja?.email || '',
      endereco: loja?.endereco || '',
      prazo_pagamento_dias: loja?.prazo_pagamento_dias ?? '',
      usa_porcentagem: loja?.usa_porcentagem ?? false,
      porcentagem_repasse: loja?.porcentagem_repasse ?? '',
      observacoes_pagamento: loja?.observacoes_pagamento || ''
    })
    setLookupError('')
    setIsLojaModalOpen(true)
  }

  const closeLojaModal = () => {
    setIsLojaModalOpen(false)
    setEditingItem(null)
    setLookupError('')
  }

  const openParticularModal = (cliente = null) => {
    setActionError('')
    setCepError('')
    setEditingItem(cliente)
    
    // Parse endereço existente (formato: "Rua, Número, Complemento, Bairro, Cidade, Estado, CEP")
    const enderecoParts = (cliente?.endereco || '').split(',').map(part => part.trim())
    const hasBairro = enderecoParts.length >= 7
    
    setParticularForm({
      nome: cliente?.nome || '',
      telefone: cliente?.telefone || '',
      endereco_rua: enderecoParts[0] || '',
      endereco_numero: enderecoParts[1] || '',
      endereco_complemento: enderecoParts[2] || '',
      endereco_bairro: hasBairro ? (enderecoParts[3] || '') : '',
      endereco_cidade: hasBairro ? (enderecoParts[4] || '') : (enderecoParts[3] || ''),
      endereco_estado: hasBairro ? (enderecoParts[5] || '') : (enderecoParts[4] || ''),
      endereco_cep: hasBairro ? (enderecoParts[6] || '') : (enderecoParts[5] || '')
    })
    setIsParticularModalOpen(true)
  }

  const closeParticularModal = () => {
    setIsParticularModalOpen(false)
    setEditingItem(null)
  }

  const openDeleteModal = (item, type) => {
    setDeleteTarget({ item, type })
    setActionError('')
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteTarget(null)
    setIsDeleteModalOpen(false)
  }

  const handleLojaSubmit = async (event) => {
    event.preventDefault()
    try {
      setIsActionLoading(true)
      setActionError('')

      const payload = {
        cnpj: lojaForm.cnpj ? sanitizeCnpj(lojaForm.cnpj) : null,
        razao_social: lojaForm.razao_social || null,
        nome_fantasia: lojaForm.nome_fantasia || null,
        telefone: lojaForm.telefone || null,
        email: lojaForm.email || null,
        endereco: lojaForm.endereco || null,
        prazo_pagamento_dias: lojaForm.prazo_pagamento_dias
          ? Number(lojaForm.prazo_pagamento_dias)
          : null,
        usa_porcentagem: lojaForm.usa_porcentagem,
        porcentagem_repasse: lojaForm.usa_porcentagem && lojaForm.porcentagem_repasse !== ''
          ? Number(lojaForm.porcentagem_repasse)
          : null,
        observacoes_pagamento: lojaForm.observacoes_pagamento || null
      }

      if (editingItem) {
        await api.put(`/lojas/${editingItem.id}`, payload)
      } else {
        await api.post('/lojas', payload)
      }

      await refetchLojas()
      closeLojaModal()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel salvar a loja.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const sanitizeCnpj = (value) => value.replace(/\D/g, '')

  const buildEndereco = (data) => {
    const endereco = data?.endereco || data?.estabelecimento

    const parts = [
      endereco?.logradouro || data?.logradouro,
      endereco?.numero || data?.numero,
      endereco?.complemento || data?.complemento,
      endereco?.municipio || data?.municipio,
      endereco?.uf || data?.uf,
      endereco?.cep || data?.cep
    ].filter(Boolean)

    return parts.join(', ')
  }

  const handleCepLookup = async () => {
    const cep = particularForm.endereco_cep.replace(/\D/g, '')

    if (cep.length !== 8) {
      setCepError('')
      return
    }

    try {
      setIsCepLoading(true)
      setCepError('')

      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      if (!response.ok) {
        throw new Error('Falha ao consultar CEP')
      }

      const data = await response.json()
      
      if (data.erro) {
        setCepError('CEP não encontrado.')
        return
      }

      // Preencher os campos automaticamente
      setParticularForm((prev) => ({
        ...prev,
        endereco_rua: data.logradouro || prev.endereco_rua,
        endereco_bairro: data.bairro || prev.endereco_bairro,
        endereco_cidade: data.localidade || prev.endereco_cidade,
        endereco_estado: data.uf || prev.endereco_estado
      }))
    } catch (err) {
      setCepError('Não foi possível consultar o CEP agora.')
    } finally {
      setIsCepLoading(false)
    }
  }

  const handleCnpjLookup = async () => {
    const cnpj = sanitizeCnpj(lojaForm.cnpj || '')

    if (cnpj.length !== 14) {
      setLookupError('Informe um CNPJ valido com 14 digitos.')
      return
    }

    try {
      setIsLookupLoading(true)
      setLookupError('')

      const response = await fetch(`https://api.opencnpj.org/${cnpj}`)
      if (!response.ok) {
        throw new Error('Falha ao consultar CNPJ')
      }

      const data = await response.json()
      const razaoSocial = data?.razao_social
        || data?.estabelecimento?.razao_social
        || ''
      const nomeFantasia = data?.nome_fantasia
        || data?.estabelecimento?.nome_fantasia
        || ''
      const endereco = buildEndereco(data)
      const telefone = data?.telefone
        || data?.estabelecimento?.telefone1
        || data?.estabelecimento?.telefone
        || ''
      const email = data?.email
        || data?.estabelecimento?.email
        || ''

      setLojaForm((prev) => ({
        ...prev,
        cnpj,
        razao_social: razaoSocial || prev.razao_social,
        nome_fantasia: nomeFantasia || prev.nome_fantasia,
        nome: prev.nome || nomeFantasia || razaoSocial,
        endereco: endereco || prev.endereco,
        telefone: telefone || prev.telefone,
        email: email || prev.email
      }))
    } catch (err) {
      setLookupError('Nao foi possivel consultar o CNPJ agora.')
    } finally {
      setIsLookupLoading(false)
    }
  }

  const handleParticularSubmit = async (event) => {
    event.preventDefault()

    // Validações
    if (!particularForm.nome.trim()) {
      setActionError('Informe o nome do cliente.')
      return
    }
    if (!particularForm.endereco_rua.trim()) {
      setActionError('Informe a rua do endereço.')
      return
    }
    if (!particularForm.endereco_numero.trim()) {
      setActionError('Informe o número do endereço.')
      return
    }
    if (!particularForm.endereco_cidade.trim()) {
      setActionError('Informe a cidade do endereço.')
      return
    }
    if (!particularForm.endereco_estado.trim()) {
      setActionError('Informe o estado do endereço.')
      return
    }
    if (!particularForm.endereco_cep.trim()) {
      setActionError('Informe o CEP do endereço.')
      return
    }

    try {
      setIsActionLoading(true)
      setActionError('')

      // Combinar campos de endereço
      const enderecoParts = [
        particularForm.endereco_rua.trim(),
        particularForm.endereco_numero.trim(),
        particularForm.endereco_complemento.trim(),
        particularForm.endereco_cidade.trim(),
        particularForm.endereco_estado.trim(),
        particularForm.endereco_cep.trim()
      ].filter(Boolean)

      const payload = {
        nome: particularForm.nome.trim(),
        telefone: particularForm.telefone || null,
        endereco: enderecoParts.join(', ')
      }

      if (editingItem) {
        await api.put(`/clientes_particulares/${editingItem.id}`, payload)
      } else {
        await api.post('/clientes_particulares', payload)
      }

      await refetchParticulares()
      closeParticularModal()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel salvar o cliente.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setIsActionLoading(true)
      setActionError('')

      if (deleteTarget.type === 'loja') {
        await api.delete(`/lojas/${deleteTarget.item.id}`)
        await refetchLojas()
      } else {
        await api.delete(`/clientes_particulares/${deleteTarget.item.id}`)
        await refetchParticulares()
      }

      closeDeleteModal()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel excluir o cliente.')
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="clientes">
      <div className="clientes__header">
        <div>
          <h1 className="clientes__title">Clientes</h1>
          <p className="clientes__subtitle">Gerencie lojas e clientes particulares</p>
        </div>
        <div className="clientes__actions">
          <button
            type="button"
            className="clientes__button"
            onClick={() => {
              if (activeTab === 'lojas') {
                openLojaModal()
              } else {
                openParticularModal()
              }
            }}
            disabled={!isAdmin}
            title={isAdmin ? '' : 'Apenas administradores podem cadastrar'}
          >
            <MdAdd /> {activeTab === 'lojas' ? 'Nova loja' : 'Novo particular'}
          </button>
        </div>
      </div>

      <div className="clientes__tabs">
        <button
          type="button"
          className={activeTab === 'lojas' ? 'clientes__tab clientes__tab--active' : 'clientes__tab'}
          onClick={() => setActiveTab('lojas')}
        >
          <MdStore /> Lojas parceiras
        </button>
        <button
          type="button"
          className={activeTab === 'particulares' ? 'clientes__tab clientes__tab--active' : 'clientes__tab'}
          onClick={() => setActiveTab('particulares')}
        >
          <MdPerson /> Particulares
        </button>
      </div>

      {isLoading && (
        <div className="clientes__loading">Carregando clientes...</div>
      )}

      {!isLoading && errorMessage && (
        <div className="clientes__error">Erro ao carregar clientes: {errorMessage}</div>
      )}

      {!isLoading && !errorMessage && (
        <Card
          title={activeTab === 'lojas' ? 'Lojas parceiras' : 'Clientes particulares'}
          subtitle={activeTab === 'lojas' ? 'Empresas que indicam montagens' : 'Clientes finais'}
          extra={(
            <div className="clientes__search">
              <MdSearch className="clientes__search-icon" />
              <input
                type="text"
                className="clientes__search-input"
                placeholder={activeTab === 'lojas' ? 'Buscar por nome ou email...' : 'Buscar por nome ou telefone...'}
                value={activeTab === 'lojas' ? lojaSearch : particularSearch}
                onChange={(event) => {
                  if (activeTab === 'lojas') {
                    setLojaSearch(event.target.value)
                  } else {
                    setParticularSearch(event.target.value)
                  }
                }}
              />
            </div>
          )}
        >
          {activeTab === 'lojas' && (
            <div className="clientes__table-wrapper">
              <table className="clientes__table">
                <thead>
                  <tr>
                    <th>Loja</th>
                    <th>Contato</th>
                    <th>Pagamento</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLojas.map((loja) => (
                    <tr key={loja.id} className="clientes__row">
                      <td>
                        <div className="clientes__name">{loja.razao_social}</div>
                        <div className="clientes__meta">
                          {loja.cnpj ? `CNPJ: ${loja.cnpj}` : 'CNPJ nao informado'}
                        </div>
                      </td>
                      <td>
                        <div>{loja.telefone || 'Telefone nao informado'}</div>
                        <div className="clientes__meta">{loja.email || 'Email nao informado'}</div>
                      </td>
                      <td>
                        <div>
                          {loja.usa_porcentagem
                            ? `Repasse ${Number(loja.porcentagem_repasse || 0).toFixed(2)}%`
                            : 'Repasse fixo'}
                        </div>
                        <div className="clientes__meta">
                          {loja.prazo_pagamento_dias
                            ? `Prazo ${loja.prazo_pagamento_dias} dias`
                            : 'Prazo nao informado'}
                        </div>
                      </td>
                      <td>
                        <span className="clientes__badge clientes__badge--active">Ativo</span>
                      </td>
                      <td>
                        <div className="clientes__row-actions">
                          <button
                            type="button"
                            className="clientes__icon-button"
                            onClick={() => openLojaModal(loja)}
                            disabled={!isAdmin}
                            title={isAdmin ? 'Editar loja' : 'Apenas administradores'}
                          >
                            <MdEdit />
                          </button>
                          <button
                            type="button"
                            className="clientes__icon-button clientes__icon-button--danger"
                            onClick={() => openDeleteModal(loja, 'loja')}
                            disabled={!isAdmin}
                            title={isAdmin ? 'Excluir loja' : 'Apenas administradores'}
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLojas.length === 0 && (
                <div className="clientes__empty">Nenhuma loja encontrada.</div>
              )}
            </div>
          )}

          {activeTab === 'particulares' && (
            <div className="clientes__table-wrapper">
              <table className="clientes__table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Contato</th>
                    <th>Endereco</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticulares.map((cliente) => (
                    <tr key={cliente.id} className="clientes__row">
                      <td>
                        <div className="clientes__name">{cliente.nome}</div>
                      </td>
                      <td>{cliente.telefone || 'Telefone nao informado'}</td>
                      <td>{cliente.endereco || 'Endereco nao informado'}</td>
                      <td>
                        <span className="clientes__badge clientes__badge--active">Ativo</span>
                      </td>
                      <td>
                        <div className="clientes__row-actions">
                          <button
                            type="button"
                            className="clientes__icon-button"
                            onClick={() => openParticularModal(cliente)}
                            disabled={!isAdmin}
                            title={isAdmin ? 'Editar cliente' : 'Apenas administradores'}
                          >
                            <MdEdit />
                          </button>
                          <button
                            type="button"
                            className="clientes__icon-button clientes__icon-button--danger"
                            onClick={() => openDeleteModal(cliente, 'particular')}
                            disabled={!isAdmin}
                            title={isAdmin ? 'Excluir cliente' : 'Apenas administradores'}
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredParticulares.length === 0 && (
                <div className="clientes__empty">Nenhum cliente encontrado.</div>
              )}
            </div>
          )}
        </Card>
      )}

      {isLojaModalOpen && (
        <div className="clientes__modal-backdrop">
          <div className="clientes__modal">
            <div className="clientes__modal-header">
              <h3>{editingItem ? 'Editar loja' : 'Nova loja'}</h3>
              <button
                type="button"
                className="clientes__icon-button"
                onClick={closeLojaModal}
              >
                <MdClose />
              </button>
            </div>
            <form className="clientes__modal-form" onSubmit={handleLojaSubmit}>
              <div className="clientes__form-row">
                <label className="clientes__label clientes__label--grow">
                  CNPJ
                  <input
                    type="text"
                    className="clientes__input"
                    value={lojaForm.cnpj}
                    onChange={(event) => setLojaForm((prev) => ({
                      ...prev,
                      cnpj: event.target.value
                    }))}
                  />
                </label>
                <button
                  type="button"
                  className="clientes__button clientes__button--ghost clientes__button--inline"
                  onClick={handleCnpjLookup}
                  disabled={isLookupLoading}
                >
                  {isLookupLoading ? 'Consultando...' : 'Consultar CNPJ'}
                </button>
              </div>
              {lookupError && (
                <div className="clientes__error clientes__error--inline">
                  {lookupError}
                </div>
              )}
              <div className="clientes__form-grid">
                <label className="clientes__label">
                  Razao social
                  <input
                    type="text"
                    className="clientes__input"
                    value={lojaForm.razao_social}
                    onChange={(event) => setLojaForm((prev) => ({
                      ...prev,
                      razao_social: event.target.value
                    }))}
                  />
                </label>
                <label className="clientes__label">
                  Nome fantasia
                  <input
                    type="text"
                    className="clientes__input"
                    value={lojaForm.nome_fantasia}
                    onChange={(event) => setLojaForm((prev) => ({
                      ...prev,
                      nome_fantasia: event.target.value
                    }))}
                  />
                </label>
              </div>
              <div className="clientes__form-grid">
                <label className="clientes__label">
                  Telefone
                  <input
                    type="text"
                    className="clientes__input"
                    value={lojaForm.telefone}
                    onChange={(event) => setLojaForm((prev) => ({
                      ...prev,
                      telefone: event.target.value
                    }))}
                  />
                </label>
                <label className="clientes__label">
                  Email
                  <input
                    type="email"
                    className="clientes__input"
                    value={lojaForm.email}
                    onChange={(event) => setLojaForm((prev) => ({
                      ...prev,
                      email: event.target.value
                    }))}
                  />
                </label>
              </div>
              <label className="clientes__label">
                Endereco
                <input
                  type="text"
                  className="clientes__input"
                  value={lojaForm.endereco}
                  onChange={(event) => setLojaForm((prev) => ({
                    ...prev,
                    endereco: event.target.value
                  }))}
                />
              </label>
              <div className="clientes__form-grid">
                <label className="clientes__label">
                  Prazo de pagamento (dias)
                  <input
                    type="number"
                    className="clientes__input"
                    min="0"
                    value={lojaForm.prazo_pagamento_dias}
                    onChange={(event) => setLojaForm((prev) => ({
                      ...prev,
                      prazo_pagamento_dias: event.target.value
                    }))}
                  />
                </label>
                <label className="clientes__label">
                  Percentual de repasse
                  <input
                    type="number"
                    className="clientes__input"
                    step="0.01"
                    min="0"
                    value={lojaForm.porcentagem_repasse}
                    onChange={(event) => setLojaForm((prev) => ({
                      ...prev,
                      porcentagem_repasse: event.target.value
                    }))}
                    disabled={!lojaForm.usa_porcentagem}
                  />
                </label>
              </div>
              <label className="clientes__checkbox">
                <input
                  type="checkbox"
                  checked={lojaForm.usa_porcentagem}
                  onChange={(event) => setLojaForm((prev) => ({
                    ...prev,
                    usa_porcentagem: event.target.checked
                  }))}
                />
                Usar percentual no repasse
              </label>
              <label className="clientes__label">
                Observacoes de pagamento
                <textarea
                  className="clientes__textarea"
                  value={lojaForm.observacoes_pagamento}
                  onChange={(event) => setLojaForm((prev) => ({
                    ...prev,
                    observacoes_pagamento: event.target.value
                  }))}
                  rows="3"
                />
              </label>
              {actionError && (
                <div className="clientes__error clientes__error--inline">
                  {actionError}
                </div>
              )}
              <div className="clientes__modal-actions">
                <button
                  type="button"
                  className="clientes__button clientes__button--ghost"
                  onClick={closeLojaModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clientes__button"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isParticularModalOpen && (
        <div className="clientes__modal-backdrop">
          <div className="clientes__modal">
            <div className="clientes__modal-header">
              <h3>{editingItem ? 'Editar cliente' : 'Novo cliente'}</h3>
              <button
                type="button"
                className="clientes__icon-button"
                onClick={closeParticularModal}
              >
                <MdClose />
              </button>
            </div>
            <form className="clientes__modal-form" onSubmit={handleParticularSubmit}>
              <label className="clientes__label">
                Nome completo *
                <input
                  type="text"
                  className="clientes__input"
                  value={particularForm.nome}
                  onChange={(event) => setParticularForm((prev) => ({
                    ...prev,
                    nome: event.target.value
                  }))}
                  required
                />
              </label>
              <label className="clientes__label">
                Telefone
                <input
                  type="text"
                  className="clientes__input"
                  value={particularForm.telefone}
                  onChange={(event) => setParticularForm((prev) => ({
                    ...prev,
                    telefone: formatTelefone(event.target.value)
                  }))}
                  placeholder="(00) 00000-0000"
                  maxLength="15"
                />
              </label>

              {/* Campos de Endereço */}
              <div className="clientes__form-grid">
                <label className="clientes__label">
                  Rua *
                  <input
                    type="text"
                    className="clientes__input"
                    value={particularForm.endereco_rua}
                    onChange={(event) => setParticularForm((prev) => ({
                      ...prev,
                      endereco_rua: event.target.value
                    }))}
                    required
                  />
                </label>
                <label className="clientes__label">
                  Número *
                  <input
                    type="text"
                    className="clientes__input"
                    value={particularForm.endereco_numero}
                    onChange={(event) => setParticularForm((prev) => ({
                      ...prev,
                      endereco_numero: event.target.value
                    }))}
                    required
                  />
                </label>
              </div>

              <label className="clientes__label">
                Complemento
                <input
                  type="text"
                  className="clientes__input"
                  value={particularForm.endereco_complemento}
                  onChange={(event) => setParticularForm((prev) => ({
                    ...prev,
                    endereco_complemento: event.target.value
                  }))}
                />
              </label>

              <div className="clientes__form-grid">
                <label className="clientes__label">
                  Bairro
                  <input
                    type="text"
                    className="clientes__input"
                    value={particularForm.endereco_bairro}
                    onChange={(event) => setParticularForm((prev) => ({
                      ...prev,
                      endereco_bairro: event.target.value
                    }))}
                  />
                </label>
                <label className="clientes__label">
                  Cidade *
                  <input
                    type="text"
                    className="clientes__input"
                    value={particularForm.endereco_cidade}
                    onChange={(event) => setParticularForm((prev) => ({
                      ...prev,
                      endereco_cidade: event.target.value
                    }))}
                    required
                  />
                </label>
              </div>

              <div className="clientes__form-grid">
                <label className="clientes__label">
                  Estado *
                  <input
                    type="text"
                    className="clientes__input"
                    value={particularForm.endereco_estado}
                    onChange={(event) => setParticularForm((prev) => ({
                      ...prev,
                      endereco_estado: formatEstado(event.target.value)
                    }))}
                    maxLength="2"
                    placeholder="SP"
                    required
                  />
                </label>
                <label className="clientes__label">
                  CEP *
                  <input
                    type="text"
                    className="clientes__input"
                    value={particularForm.endereco_cep}
                    onChange={(event) => setParticularForm((prev) => ({
                      ...prev,
                      endereco_cep: formatCep(event.target.value)
                    }))}
                    onBlur={handleCepLookup}
                    placeholder="00000-000"
                    maxLength="9"
                    disabled={isCepLoading}
                    required
                  />
                </label>
              </div>
              
              {isCepLoading && (
                <div className="clientes__info clientes__info--inline">
                  Buscando endereço...
                </div>
              )}
              {cepError && (
                <div className="clientes__error clientes__error--inline">
                  {cepError}
                </div>
              )}
              {actionError && (
                <div className="clientes__error clientes__error--inline">
                  {actionError}
                </div>
              )}
              <div className="clientes__modal-actions">
                <button
                  type="button"
                  className="clientes__button clientes__button--ghost"
                  onClick={closeParticularModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clientes__button"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deleteTarget && (
        <div className="clientes__modal-backdrop">
          <div className="clientes__modal clientes__modal--small">
            <div className="clientes__modal-header">
              <h3>Excluir</h3>
              <button
                type="button"
                className="clientes__icon-button"
                onClick={closeDeleteModal}
              >
                <MdClose />
              </button>
            </div>
            <p className="clientes__modal-text">
              Tem certeza que deseja excluir <strong>{deleteTarget.item.nome}</strong>?
            </p>
            {actionError && (
              <div className="clientes__error clientes__error--inline">
                {actionError}
              </div>
            )}
            <div className="clientes__modal-actions">
              <button
                type="button"
                className="clientes__button clientes__button--ghost"
                onClick={closeDeleteModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="clientes__button clientes__button--danger"
                onClick={handleDelete}
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clientes
