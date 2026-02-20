import React, { useMemo, useState } from 'react'
import {
  MdAdd,
  MdClose,
  MdDelete,
  MdEdit,
  MdSearch
} from 'react-icons/md'
import Card from '../../components/Card/Card'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../hooks/useApi'
import api from '../../services/api'
import './Produtos.css'

/**
 * Página de produtos por loja.
 *
 * @returns {JSX.Element}
 */
const Produtos = () => {
  const [search, setSearch] = useState('')
  const [lojaFilter, setLojaFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionError, setActionError] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [produtoForm, setProdutoForm] = useState({
    nome: '',
    loja_id: '',
    valor_base: '',
    tempo_base_min: '',
    ativo: true
  })

  const {
    data: produtos,
    loading: produtosLoading,
    error: produtosError,
    refetch: refetchProdutos
  } = useApi('/produtos', 'GET', [])

  const {
    data: lojas,
    loading: lojasLoading,
    error: lojasError
  } = useApi('/lojas', 'GET', [])

  const { user } = useAuth()
  const isAdmin = user?.tipo === 'admin'

  const produtosList = useMemo(
    () => (Array.isArray(produtos) ? produtos : []),
    [produtos]
  )

  const lojasList = useMemo(
    () => (Array.isArray(lojas) ? lojas : []),
    [lojas]
  )

  const lojasById = useMemo(() => {
    return lojasList.reduce((acc, loja) => {
      acc[loja.id] = loja
      return acc
    }, {})
  }, [lojasList])

  const filteredProdutos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return produtosList.filter((produto) => {
      const matchesSearch = !normalizedSearch
        || produto.nome?.toLowerCase().includes(normalizedSearch)

      const matchesLoja = !lojaFilter || produto.loja_id === lojaFilter

      return matchesSearch && matchesLoja
    })
  }, [produtosList, search, lojaFilter])

  const isLoading = produtosLoading || lojasLoading
  const errorMessage = produtosError || lojasError

  const openModal = (produto = null) => {
    setActionError('')
    setEditingProduto(produto)
    setProdutoForm({
      nome: produto?.nome || '',
      loja_id: produto?.loja_id || '',
      valor_base: produto?.valor_base ?? '',
      tempo_base_min: produto?.tempo_base_min ?? '',
      ativo: produto?.ativo ?? true
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduto(null)
  }

  const openDeleteModal = (produto) => {
    setDeleteTarget(produto)
    setActionError('')
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteTarget(null)
    setIsDeleteModalOpen(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!produtoForm.nome.trim()) {
      setActionError('Informe o nome do móvel.')
      return
    }

    if (!produtoForm.loja_id) {
      setActionError('Selecione uma loja.')
      return
    }

    if (!produtoForm.tempo_base_min) {
      setActionError('Informe o tempo base em minutos.')
      return
    }

    try {
      setIsActionLoading(true)
      setActionError('')

      const payload = {
        nome: produtoForm.nome.trim(),
        loja_id: produtoForm.loja_id,
        valor_base: produtoForm.valor_base !== '' ? Number(produtoForm.valor_base) : null,
        tempo_base_min: Number(produtoForm.tempo_base_min),
        ativo: produtoForm.ativo
      }

      if (editingProduto) {
        await api.put(`/produtos/${editingProduto.id}`, payload)
      } else {
        await api.post('/produtos', payload)
      }

      await refetchProdutos()
      closeModal()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel salvar o produto.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setIsActionLoading(true)
      setActionError('')
      await api.delete(`/produtos/${deleteTarget.id}`)
      await refetchProdutos()
      closeDeleteModal()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel excluir o produto.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleToggleStatus = async (produto) => {
    if (!isAdmin) return

    try {
      await api.put(`/produtos/${produto.id}`, {
        ...produto,
        ativo: !produto.ativo
      })
      await refetchProdutos()
    } catch (err) {
      console.error('Erro ao alterar status:', err)
    }
  }

  return (
    <div className="produtos">
      <div className="produtos__header">
        <div>
          <h1 className="produtos__title">Produtos</h1>
          <p className="produtos__subtitle">
            Cadastre movéis por loja para calcular repasse automaticamente
          </p>
        </div>
        <div className="produtos__actions">
          <button
            type="button"
            className="produtos__button"
            onClick={() => openModal()}
            disabled={!isAdmin}
            title={isAdmin ? '' : 'Apenas administradores podem cadastrar'}
          >
            <MdAdd /> Novo móvel
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="produtos__loading">Carregando produtos...</div>
      )}

      {!isLoading && errorMessage && (
        <div className="produtos__error">Erro ao carregar produtos: {errorMessage}</div>
      )}

      {!isLoading && !errorMessage && (
        <Card
          title="Lista de movéis"
          subtitle="Mesmo móvel pode existir em lojas diferentes"
          extra={(
            <div className="produtos__filters">
              <div className="produtos__search">
                <MdSearch className="produtos__search-icon" />
                <input
                  type="text"
                  className="produtos__search-input"
                  placeholder="Buscar móvel..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <select
                className="produtos__select"
                value={lojaFilter}
                onChange={(event) => setLojaFilter(event.target.value)}
              >
                <option value="">Todas as lojas</option>
                {lojasList.map((loja) => (
                  <option key={loja.id} value={loja.id}>
                    {loja.nome || loja.nome_fantasia || loja.razao_social}
                  </option>
                ))}
              </select>
            </div>
          )}
        >
          <div className="produtos__table-wrapper">
            <table className="produtos__table">
              <thead>
                <tr>
                  <th>móvel</th>
                  <th>Loja</th>
                  <th>Valor base</th>
                  <th>Tempo (min)</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredProdutos.map((produto) => (
                  <tr key={produto.id} className="produtos__row">
                    <td>
                      <div className="produtos__name">{produto.nome}</div>
                    </td>
                    <td>
                      {produto.loja_id
                        ? (
                          lojasById[produto.loja_id]?.nome
                          || lojasById[produto.loja_id]?.nome_fantasia
                          || lojasById[produto.loja_id]?.razao_social
                          || 'Loja nao encontrada'
                        )
                        : 'Sem loja'}
                    </td>
                    <td>
                      {produto.valor_base !== null && produto.valor_base !== undefined
                        ? `R$ ${Number(produto.valor_base).toFixed(2)}`
                        : 'Nao informado'}
                    </td>
                    <td>{produto.tempo_base_min}</td>
                    <td>
                      <span
                        className={
                          produto.ativo
                            ? 'produtos__badge produtos__badge--active'
                            : 'produtos__badge produtos__badge--inactive'
                        }
                        onClick={() => isAdmin && handleToggleStatus(produto)}
                        style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                        title={isAdmin ? 'Clique para alterar status' : ''}
                      >
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="produtos__row-actions">
                        <button
                          type="button"
                          className="produtos__icon-button"
                          onClick={() => openModal(produto)}
                          disabled={!isAdmin}
                          title={isAdmin ? 'Editar móvel' : 'Apenas administradores'}
                        >
                          <MdEdit />
                        </button>
                        <button
                          type="button"
                          className="produtos__icon-button produtos__icon-button--danger"
                          onClick={() => openDeleteModal(produto)}
                          disabled={!isAdmin}
                          title={isAdmin ? 'Excluir móvel' : 'Apenas administradores'}
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProdutos.length === 0 && (
              <div className="produtos__empty">Nenhum móvel encontrado.</div>
            )}
          </div>
        </Card>
      )}

      {isModalOpen && (
        <div className="produtos__modal-backdrop">
          <div className="produtos__modal">
            <div className="produtos__modal-header">
              <h3>{editingProduto ? 'Editar móvel' : 'Novo móvel'}</h3>
              <button
                type="button"
                className="produtos__icon-button"
                onClick={closeModal}
              >
                <MdClose />
              </button>
            </div>
            <form className="produtos__modal-form" onSubmit={handleSubmit}>
              <label className="produtos__label">
                Loja
                <select
                  className="produtos__input"
                  value={produtoForm.loja_id}
                  onChange={(event) => setProdutoForm((prev) => ({
                    ...prev,
                    loja_id: event.target.value
                  }))}
                  required
                >
                  <option value="">Selecione uma loja</option>
                  {lojasList.map((loja) => (
                    <option key={loja.id} value={loja.id}>
                      {loja.nome || loja.nome_fantasia || loja.razao_social}
                    </option>
                  ))}
                </select>
              </label>
              <label className="produtos__label">
                Nome do móvel
                <input
                  type="text"
                  className="produtos__input"
                  value={produtoForm.nome}
                  onChange={(event) => setProdutoForm((prev) => ({
                    ...prev,
                    nome: event.target.value
                  }))}
                  required
                />
              </label>
              <div className="produtos__form-grid">
                <label className="produtos__label">
                  Valor base
                  <input
                    type="number"
                    className="produtos__input"
                    step="0.01"
                    min="0"
                    value={produtoForm.valor_base}
                    onChange={(event) => setProdutoForm((prev) => ({
                      ...prev,
                      valor_base: event.target.value
                    }))}
                  />
                </label>
                <label className="produtos__label">
                  Tempo base (min)
                  <input
                    type="number"
                    className="produtos__input"
                    min="1"
                    value={produtoForm.tempo_base_min}
                    onChange={(event) => setProdutoForm((prev) => ({
                      ...prev,
                      tempo_base_min: event.target.value
                    }))}
                    required
                  />
                </label>
              </div>
              <label className="produtos__checkbox">
                <input
                  type="checkbox"
                  checked={produtoForm.ativo}
                  onChange={(event) => setProdutoForm((prev) => ({
                    ...prev,
                    ativo: event.target.checked
                  }))}
                />
                Produto ativo
              </label>
              {actionError && (
                <div className="produtos__error produtos__error--inline">
                  {actionError}
                </div>
              )}
              <div className="produtos__modal-actions">
                <button
                  type="button"
                  className="produtos__button produtos__button--ghost"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="produtos__button"
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
        <div className="produtos__modal-backdrop">
          <div className="produtos__modal produtos__modal--small">
            <div className="produtos__modal-header">
              <h3>Excluir móvel</h3>
              <button
                type="button"
                className="produtos__icon-button"
                onClick={closeDeleteModal}
              >
                <MdClose />
              </button>
            </div>
            <p className="produtos__modal-text">
              Tem certeza que deseja excluir <strong>{deleteTarget.nome}</strong>?
            </p>
            {actionError && (
              <div className="produtos__error produtos__error--inline">
                {actionError}
              </div>
            )}
            <div className="produtos__modal-actions">
              <button
                type="button"
                className="produtos__button produtos__button--ghost"
                onClick={closeDeleteModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="produtos__button produtos__button--danger"
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

export default Produtos
