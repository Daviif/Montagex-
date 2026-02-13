import React, { useEffect, useMemo, useState } from 'react'
import {
  MdAdd,
  MdClose,
  MdDelete,
  MdEdit,
  MdGroup,
  MdLink,
  MdLinkOff,
  MdPeople,
  MdPerson,
  MdPersonOff,
  MdRefresh,
  MdSearch
} from 'react-icons/md'
import bcrypt from 'bcryptjs'
import Card from '../../components/Card/Card'
import StatCard from '../../components/StatCard/StatCard'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../hooks/useApi'
import { useDate } from '../../hooks/useFormatters'
import api from '../../services/api'
import './Equipe.css'

/**
 * Página de gerenciamento de equipes e montadores.
 *
 * @returns {JSX.Element}
 */
const Equipe = () => {
  // ===== HOOKS DE ESTADO =====
  const [activeTab, setActiveTab] = useState('montadores')
  const [search, setSearch] = useState('')
  const [montadorSearch, setMontadorSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todas')
  const [selectedEquipeId, setSelectedEquipeId] = useState(null)
  const [isEquipeModalOpen, setIsEquipeModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isMontadorModalOpen, setIsMontadorModalOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [editingEquipe, setEditingEquipe] = useState(null)
  const [equipeForm, setEquipeForm] = useState({
    nome: '',
    ativa: true
  })
  const [montadorForm, setMontadorForm] = useState({
    nome: '',
    email: '',
    senha: '',
    ativo: true,
    isAdmin: false
  })

  // ===== DADOS =====
  const {
    data: equipes,
    loading: equipesLoading,
    error: equipesError,
    refetch: refetchEquipes
  } = useApi('/equipes', 'GET', [])
  const {
    data: equipeMembros,
    loading: membrosLoading,
    error: membrosError,
    refetch: refetchMembros
  } = useApi('/equipe_membros', 'GET', [])
  const {
    data: usuarios,
    loading: usuariosLoading,
    error: usuariosError,
    refetch: refetchUsuarios
  } = useApi('/usuarios', 'GET', [])

  const { user } = useAuth()
  const { formatDate } = useDate()

  const isAdmin = user?.tipo === 'admin'

  const equipesList = useMemo(
    () => (Array.isArray(equipes) ? equipes : []),
    [equipes]
  )
  const membrosList = useMemo(
    () => (Array.isArray(equipeMembros) ? equipeMembros : []),
    [equipeMembros]
  )
  const usuariosList = useMemo(
    () => (Array.isArray(usuarios) ? usuarios : []),
    [usuarios]
  )

  const usuariosById = useMemo(() => {
    return usuariosList.reduce((acc, usuario) => {
      acc[usuario.id] = usuario
      return acc
    }, {})
  }, [usuariosList])

  const equipesById = useMemo(() => {
    return equipesList.reduce((acc, equipe) => {
      acc[equipe.id] = equipe
      return acc
    }, {})
  }, [equipesList])

  const membrosPorEquipe = useMemo(() => {
    return membrosList.reduce((acc, membro) => {
      acc[membro.equipe_id] = (acc[membro.equipe_id] || 0) + 1
      return acc
    }, {})
  }, [membrosList])

  const totalEquipes = equipesList.length
  const equipesAtivas = equipesList.filter((equipe) => equipe.ativa).length
  const totalMembros = membrosList.length
  const montadoresAtivos = usuariosList.filter(
    (usuario) => usuario.tipo === 'montador' && usuario.ativo
  ).length

  const membrosIds = useMemo(() => {
    return new Set(membrosList.map((membro) => membro.usuario_id))
  }, [membrosList])

  const montadoresSemEquipe = useMemo(() => {
    return usuariosList.filter(
      (usuario) => usuario.tipo === 'montador' && !membrosIds.has(usuario.id)
    )
  }, [usuariosList, membrosIds])

  const montadoresList = useMemo(() => {
    const normalizedSearch = montadorSearch.trim().toLowerCase()

    return usuariosList
      .filter((usuario) => usuario.tipo === 'montador')
      .filter((usuario) => {
        if (!normalizedSearch) return true
        return (
          usuario.nome?.toLowerCase().includes(normalizedSearch)
          || usuario.email?.toLowerCase().includes(normalizedSearch)
        )
      })
  }, [usuariosList, montadorSearch])

  const filteredEquipes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return equipesList.filter((equipe) => {
      const matchesSearch = !normalizedSearch
        || equipe.nome.toLowerCase().includes(normalizedSearch)

      const matchesStatus = statusFilter === 'todas'
        || (statusFilter === 'ativas' && equipe.ativa)
        || (statusFilter === 'inativas' && !equipe.ativa)

      return matchesSearch && matchesStatus
    })
  }, [equipesList, search, statusFilter])

  const equipeSelecionada = useMemo(() => {
    return equipesList.find((equipe) => equipe.id === selectedEquipeId) || null
  }, [equipesList, selectedEquipeId])

  const membrosEquipeSelecionada = useMemo(() => {
    if (!selectedEquipeId) return []

    return membrosList
      .filter((membro) => membro.equipe_id === selectedEquipeId)
      .map((membro) => ({
        ...membro,
        usuario: usuariosById[membro.usuario_id]
      }))
      .sort((a, b) => {
        const nomeA = a.usuario?.nome || ''
        const nomeB = b.usuario?.nome || ''
        return nomeA.localeCompare(nomeB)
      })
  }, [membrosList, selectedEquipeId, usuariosById])

  const isLoading = equipesLoading || membrosLoading || usuariosLoading
  const errorMessage = equipesError || membrosError || usuariosError

  useEffect(() => {
    if (!selectedEquipeId && equipesList.length > 0) {
      setSelectedEquipeId(equipesList[0].id)
    }
  }, [equipesList, selectedEquipeId])

  const handleRefresh = () => {
    refetchEquipes()
    refetchMembros()
    refetchUsuarios()
  }

  const openEquipeModal = (equipe = null) => {
    setActionError('')
    setEditingEquipe(equipe)
    setEquipeForm({
      nome: equipe?.nome || '',
      ativa: equipe?.ativa ?? true
    })
    setIsEquipeModalOpen(true)
  }

  const closeEquipeModal = () => {
    setIsEquipeModalOpen(false)
    setEditingEquipe(null)
  }

  const openMontadorModal = () => {
    setActionError('')
    setMontadorForm({
      nome: '',
      email: '',
      senha: '',
      ativo: true,
      isAdmin: false
    })
    setIsMontadorModalOpen(true)
  }

  const closeMontadorModal = () => {
    setIsMontadorModalOpen(false)
  }

  const handleEquipeSubmit = async (event) => {
    event.preventDefault()

    if (!equipeForm.nome.trim()) {
      setActionError('Informe o nome da equipe.')
      return
    }

    try {
      setIsActionLoading(true)
      setActionError('')

      if (editingEquipe) {
        await api.put(`/equipes/${editingEquipe.id}`, {
          nome: equipeForm.nome.trim(),
          ativa: equipeForm.ativa
        })
      } else {
        const response = await api.post('/equipes', {
          nome: equipeForm.nome.trim(),
          ativa: equipeForm.ativa
        })
        setSelectedEquipeId(response.data.id)
      }

      await refetchEquipes()
      closeEquipeModal()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel salvar a equipe.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const openDeleteModal = (equipe) => {
    setEditingEquipe(equipe)
    setIsDeleteModalOpen(true)
    setActionError('')
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setEditingEquipe(null)
  }

  const handleDeleteEquipe = async () => {
    if (!editingEquipe) return

    try {
      setIsActionLoading(true)
      setActionError('')
      await api.delete(`/equipes/${editingEquipe.id}`)
      await refetchEquipes()
      await refetchMembros()

      if (selectedEquipeId === editingEquipe.id) {
        setSelectedEquipeId(null)
      }

      closeDeleteModal()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel remover a equipe.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleVincularMembro = async (usuarioId) => {
    if (!selectedEquipeId) return

    try {
      setIsActionLoading(true)
      setActionError('')
      await api.post('/equipe_membros', {
        equipe_id: selectedEquipeId,
        usuario_id: usuarioId
      })
      await refetchMembros()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel vincular o montador.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDesvincularMembro = async (membroId) => {
    try {
      setIsActionLoading(true)
      setActionError('')
      await api.delete(`/equipe_membros/${membroId}`)
      await refetchMembros()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel desvincular o montador.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleToggleMontador = async (usuarioId, ativo) => {
    try {
      setIsActionLoading(true)
      setActionError('')
      await api.put(`/usuarios/${usuarioId}`, { ativo: !ativo })
      await refetchUsuarios()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel atualizar o montador.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleMontadorSubmit = async (event) => {
    event.preventDefault()

    if (!montadorForm.nome.trim() || !montadorForm.email.trim() || !montadorForm.senha) {
      setActionError('Preencha nome, email e senha do montador.')
      return
    }

    try {
      setIsActionLoading(true)
      setActionError('')

      const senhaHash = await bcrypt.hash(montadorForm.senha, 10)

      await api.post('/usuarios', {
        nome: montadorForm.nome.trim(),
        email: montadorForm.email.trim(),
        senha_hash: senhaHash,
        tipo: montadorForm.isAdmin ? 'admin' : 'montador',
        ativo: montadorForm.ativo
      })

      await refetchUsuarios()
      closeMontadorModal()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Nao foi possivel cadastrar o montador.')
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="equipe">
      <div className="equipe__header">
        <div>
          <h1 className="equipe__title">Equipe</h1>
          <p className="equipe__subtitle">Gerencie montadores e equipes</p>
        </div>
        <div className="equipe__actions">
          {activeTab === 'equipes' && (
            <button
              type="button"
              className="equipe__button"
              onClick={() => openEquipeModal()}
              disabled={!isAdmin}
              title={isAdmin ? '' : 'Apenas administradores podem criar equipes'}
            >
              <MdAdd /> Nova equipe
            </button>
          )}
          {activeTab === 'montadores' && (
            <button
              type="button"
              className="equipe__button"
              onClick={openMontadorModal}
              disabled={!isAdmin}
              title={isAdmin ? '' : 'Apenas administradores podem cadastrar montadores'}
            >
              <MdAdd /> Novo montador
            </button>
          )}
          <button
            type="button"
            className="equipe__button equipe__button--ghost"
            onClick={handleRefresh}
          >
            <MdRefresh /> Atualizar
          </button>
        </div>
      </div>

      <div className="equipe__stats">
        <StatCard
          title="Equipes Ativas"
          value={equipesAtivas}
          icon={MdGroup}
          iconBg="#27AE60"
          subtitle={`de ${totalEquipes} cadastradas`}
        />
        <StatCard
          title="Montadores Ativos"
          value={montadoresAtivos}
          icon={MdPeople}
          iconBg="#3498DB"
        />
        <StatCard
          title="Membros Vinculados"
          value={totalMembros}
          icon={MdPerson}
          iconBg="#FF6B35"
        />
        <StatCard
          title="Sem Equipe"
          value={montadoresSemEquipe.length}
          icon={MdPersonOff}
          iconBg="#E74C3C"
        />
      </div>

      {isLoading && (
        <div className="equipe__loading">Carregando dados da equipe...</div>
      )}

      {!isLoading && errorMessage && (
        <div className="equipe__error">
          Erro ao carregar dados: {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && (
        <div>
          <div className="equipe__tabs">
            <button
              type="button"
              className={activeTab === 'montadores' ? 'equipe__tab equipe__tab--active' : 'equipe__tab'}
              onClick={() => setActiveTab('montadores')}
            >
              <MdPeople /> Montadores
            </button>
            <button
              type="button"
              className={activeTab === 'equipes' ? 'equipe__tab equipe__tab--active' : 'equipe__tab'}
              onClick={() => setActiveTab('equipes')}
            >
              <MdGroup /> Equipes
            </button>
          </div>

          {activeTab === 'montadores' && (
            <div className="equipe__tab-panel">
              <Card
                title="Montadores"
                subtitle="Montadores podem receber servicos mesmo sem equipe"
                extra={(
                  <div className="equipe__filters">
                    <div className="equipe__search">
                      <MdSearch className="equipe__search-icon" />
                      <input
                        type="text"
                        className="equipe__search-input"
                        placeholder="Buscar por nome ou email..."
                        value={montadorSearch}
                        onChange={(event) => setMontadorSearch(event.target.value)}
                      />
                    </div>
                  </div>
                )}
              >
                <div className="equipe__table-wrapper">
                  <table className="equipe__table">
                    <thead>
                      <tr>
                        <th>Montador</th>
                        <th>Contato</th>
                        <th>Equipe</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {montadoresList.map((montador) => {
                        const equipesDoMontador = membrosList
                          .filter((membro) => membro.usuario_id === montador.id)
                          .map((membro) => equipesById[membro.equipe_id]?.nome)
                          .filter(Boolean)

                        return (
                          <tr key={montador.id} className="equipe__row">
                            <td>
                              <div className="equipe__name">{montador.nome}</div>
                            </td>
                            <td>{montador.email || 'Sem email'}</td>
                            <td>{equipesDoMontador.length > 0 ? equipesDoMontador.join(', ') : 'Sem equipe'}</td>
                            <td>
                              <span
                                className={
                                  montador.ativo
                                    ? 'equipe__badge equipe__badge--active'
                                    : 'equipe__badge equipe__badge--inactive'
                                }
                              >
                                {montador.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td>
                              <div className="equipe__row-actions">
                                <button
                                  type="button"
                                  className="equipe__icon-button"
                                  onClick={() => handleToggleMontador(montador.id, montador.ativo)}
                                  disabled={!isAdmin}
                                  title={isAdmin ? 'Ativar/inativar montador' : 'Apenas administradores'}
                                >
                                  <MdPerson />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {montadoresList.length === 0 && (
                    <div className="equipe__empty">
                      Nenhum montador encontrado com os filtros atuais.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'equipes' && (
            <div className="equipe__content">
              <div className="equipe__column">
                <Card
                  title="Equipes"
                  subtitle="Selecione uma equipe para ver detalhes"
                  extra={(
                    <div className="equipe__filters">
                      <div className="equipe__search">
                        <MdSearch className="equipe__search-icon" />
                        <input
                          type="text"
                          className="equipe__search-input"
                          placeholder="Buscar equipe..."
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                        />
                      </div>
                      <select
                        className="equipe__select"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                      >
                        <option value="todas">Todas</option>
                        <option value="ativas">Ativas</option>
                        <option value="inativas">Inativas</option>
                      </select>
                    </div>
                  )}
                >
                  <div className="equipe__table-wrapper">
                    <table className="equipe__table">
                      <thead>
                        <tr>
                          <th>Equipe</th>
                          <th>Status</th>
                          <th>Membros</th>
                          <th>Criada em</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEquipes.map((equipe) => (
                          <tr
                            key={equipe.id}
                            className={
                              equipe.id === selectedEquipeId
                                ? 'equipe__row equipe__row--active'
                                : 'equipe__row'
                            }
                          >
                            <td>
                              <div className="equipe__name">{equipe.nome}</div>
                            </td>
                            <td>
                              <span
                                className={
                                  equipe.ativa
                                    ? 'equipe__badge equipe__badge--active'
                                    : 'equipe__badge equipe__badge--inactive'
                                }
                              >
                                {equipe.ativa ? 'Ativa' : 'Inativa'}
                              </span>
                            </td>
                            <td>{membrosPorEquipe[equipe.id] || 0}</td>
                            <td>{formatDate(equipe.created_at)}</td>
                            <td>
                              <div className="equipe__row-actions">
                                <button
                                  type="button"
                                  className="equipe__button equipe__button--small"
                                  onClick={() => setSelectedEquipeId(equipe.id)}
                                >
                                  Ver detalhes
                                </button>
                                <button
                                  type="button"
                                  className="equipe__icon-button"
                                  onClick={() => openEquipeModal(equipe)}
                                  disabled={!isAdmin}
                                  title={isAdmin ? 'Editar equipe' : 'Apenas administradores'}
                                >
                                  <MdEdit />
                                </button>
                                <button
                                  type="button"
                                  className="equipe__icon-button equipe__icon-button--danger"
                                  onClick={() => openDeleteModal(equipe)}
                                  disabled={!isAdmin}
                                  title={isAdmin ? 'Excluir equipe' : 'Apenas administradores'}
                                >
                                  <MdDelete />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredEquipes.length === 0 && (
                      <div className="equipe__empty">
                        Nenhuma equipe encontrada com os filtros atuais.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="equipe__column">
                <Card
                  title="Detalhes da equipe"
                  subtitle={
                    equipeSelecionada
                      ? `Equipe ${equipeSelecionada.nome}`
                      : 'Selecione uma equipe para ver detalhes'
                  }
                >
                  {!equipeSelecionada && (
                    <div className="equipe__empty">
                      Nenhuma equipe selecionada.
                    </div>
                  )}

                  {equipeSelecionada && (
                    <div className="equipe__details">
                      <div className="equipe__details-header">
                        <div>
                          <h3 className="equipe__details-title">{equipeSelecionada.nome}</h3>
                          <p className="equipe__details-subtitle">
                            Criada em {formatDate(equipeSelecionada.created_at)}
                          </p>
                        </div>
                        <span
                          className={
                            equipeSelecionada.ativa
                              ? 'equipe__badge equipe__badge--active'
                              : 'equipe__badge equipe__badge--inactive'
                          }
                        >
                          {equipeSelecionada.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>

                      <div className="equipe__details-stats">
                        <div>
                          <span className="equipe__details-label">Total de membros</span>
                          <strong className="equipe__details-value">
                            {membrosPorEquipe[equipeSelecionada.id] || 0}
                          </strong>
                        </div>
                        <div>
                          <span className="equipe__details-label">Montadores ativos</span>
                          <strong className="equipe__details-value">
                            {membrosEquipeSelecionada.filter((membro) => membro.usuario?.ativo).length}
                          </strong>
                        </div>
                      </div>

                      <div className="equipe__members">
                        <h4 className="equipe__members-title">Membros</h4>
                        {membrosEquipeSelecionada.length === 0 && (
                          <div className="equipe__empty">
                            Nenhum membro vinculado a esta equipe.
                          </div>
                        )}
                        {membrosEquipeSelecionada.length > 0 && (
                          <ul className="equipe__members-list">
                            {membrosEquipeSelecionada.map((membro) => (
                              <li key={membro.id} className="equipe__member-item">
                                <div>
                                  <p className="equipe__member-name">
                                    {membro.usuario?.nome || 'Usuário não encontrado'}
                                  </p>
                                  <p className="equipe__member-email">
                                    {membro.usuario?.email || 'Sem email'}
                                  </p>
                                </div>
                                <div className="equipe__member-actions">
                                  <span
                                    className={
                                      membro.usuario?.ativo
                                        ? 'equipe__badge equipe__badge--active'
                                        : 'equipe__badge equipe__badge--inactive'
                                    }
                                  >
                                    {membro.usuario?.ativo ? 'Ativo' : 'Inativo'}
                                  </span>
                                  <button
                                    type="button"
                                    className="equipe__icon-button"
                                    onClick={() => handleToggleMontador(membro.usuario?.id, membro.usuario?.ativo)}
                                    disabled={!isAdmin || !membro.usuario}
                                    title={isAdmin ? 'Ativar/inativar montador' : 'Apenas administradores'}
                                  >
                                    <MdPerson />
                                  </button>
                                  <button
                                    type="button"
                                    className="equipe__icon-button"
                                    onClick={() => handleDesvincularMembro(membro.id)}
                                    disabled={!isAdmin}
                                    title={isAdmin ? 'Desvincular montador' : 'Apenas administradores'}
                                  >
                                    <MdLinkOff />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                <Card
                  title="Montadores sem equipe"
                  subtitle="Profissionais disponiveis para vinculo"
                  className="equipe__card-spacer"
                >
                  {montadoresSemEquipe.length === 0 && (
                    <div className="equipe__empty">Todos os montadores estao vinculados.</div>
                  )}
                  {montadoresSemEquipe.length > 0 && (
                    <ul className="equipe__members-list">
                      {montadoresSemEquipe.map((montador) => (
                        <li key={montador.id} className="equipe__member-item">
                          <div>
                            <p className="equipe__member-name">{montador.nome}</p>
                            <p className="equipe__member-email">{montador.email || 'Sem email'}</p>
                          </div>
                          <div className="equipe__member-actions">
                            <span
                              className={
                                montador.ativo
                                  ? 'equipe__badge equipe__badge--active'
                                  : 'equipe__badge equipe__badge--inactive'
                              }
                            >
                              {montador.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                            <button
                              type="button"
                              className="equipe__icon-button"
                              onClick={() => handleToggleMontador(montador.id, montador.ativo)}
                              disabled={!isAdmin}
                              title={isAdmin ? 'Ativar/inativar montador' : 'Apenas administradores'}
                            >
                              <MdPerson />
                            </button>
                            <button
                              type="button"
                              className="equipe__icon-button"
                              onClick={() => handleVincularMembro(montador.id)}
                              disabled={!isAdmin || !selectedEquipeId}
                              title={
                                selectedEquipeId
                                  ? 'Vincular montador na equipe selecionada'
                                  : 'Selecione uma equipe'
                              }
                            >
                              <MdLink />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {actionError && (
        <div className="equipe__error equipe__error--inline">
          {actionError}
        </div>
      )}

      {isEquipeModalOpen && (
        <div className="equipe__modal-backdrop">
          <div className="equipe__modal">
            <div className="equipe__modal-header">
              <h3>{editingEquipe ? 'Editar equipe' : 'Nova equipe'}</h3>
              <button
                type="button"
                className="equipe__icon-button"
                onClick={closeEquipeModal}
              >
                <MdClose />
              </button>
            </div>
            <form className="equipe__modal-form" onSubmit={handleEquipeSubmit}>
              <label className="equipe__label">
                Nome da equipe
                <input
                  type="text"
                  className="equipe__input"
                  value={equipeForm.nome}
                  onChange={(event) => setEquipeForm((prev) => ({
                    ...prev,
                    nome: event.target.value
                  }))}
                  required
                />
              </label>
              <label className="equipe__checkbox">
                <input
                  type="checkbox"
                  checked={equipeForm.ativa}
                  onChange={(event) => setEquipeForm((prev) => ({
                    ...prev,
                    ativa: event.target.checked
                  }))}
                />
                Equipe ativa
              </label>
              {actionError && (
                <div className="equipe__error equipe__error--inline">
                  {actionError}
                </div>
              )}
              <div className="equipe__modal-actions">
                <button
                  type="button"
                  className="equipe__button equipe__button--ghost"
                  onClick={closeEquipeModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="equipe__button"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && editingEquipe && (
        <div className="equipe__modal-backdrop">
          <div className="equipe__modal equipe__modal--small">
            <div className="equipe__modal-header">
              <h3>Excluir equipe</h3>
              <button
                type="button"
                className="equipe__icon-button"
                onClick={closeDeleteModal}
              >
                <MdClose />
              </button>
            </div>
            <p className="equipe__modal-text">
              Tem certeza que deseja excluir a equipe <strong>{editingEquipe.nome}</strong>?
            </p>
            {actionError && (
              <div className="equipe__error equipe__error--inline">
                {actionError}
              </div>
            )}
            <div className="equipe__modal-actions">
              <button
                type="button"
                className="equipe__button equipe__button--ghost"
                onClick={closeDeleteModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="equipe__button equipe__button--danger"
                onClick={handleDeleteEquipe}
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isMontadorModalOpen && (
        <div className="equipe__modal-backdrop">
          <div className="equipe__modal">
            <div className="equipe__modal-header">
              <h3>Novo montador</h3>
              <button
                type="button"
                className="equipe__icon-button"
                onClick={closeMontadorModal}
              >
                <MdClose />
              </button>
            </div>
            <form className="equipe__modal-form" onSubmit={handleMontadorSubmit}>
              <label className="equipe__label">
                Nome completo
                <input
                  type="text"
                  className="equipe__input"
                  value={montadorForm.nome}
                  onChange={(event) => setMontadorForm((prev) => ({
                    ...prev,
                    nome: event.target.value
                  }))}
                  required
                />
              </label>
              <label className="equipe__label">
                Email
                <input
                  type="email"
                  className="equipe__input"
                  value={montadorForm.email}
                  onChange={(event) => setMontadorForm((prev) => ({
                    ...prev,
                    email: event.target.value
                  }))}
                  required
                />
              </label>
              <label className="equipe__label">
                Senha temporaria
                <input
                  type="password"
                  className="equipe__input"
                  value={montadorForm.senha}
                  onChange={(event) => setMontadorForm((prev) => ({
                    ...prev,
                    senha: event.target.value
                  }))}
                  required
                />
              </label>
              <label className="equipe__checkbox">
                <input
                  type="checkbox"
                  checked={montadorForm.ativo}
                  onChange={(event) => setMontadorForm((prev) => ({
                    ...prev,
                    ativo: event.target.checked
                  }))}
                />
                Montador ativo
              </label>
              {isAdmin && (
                <label className="equipe__checkbox">
                  <input
                    type="checkbox"
                    checked={montadorForm.isAdmin}
                    onChange={(event) => setMontadorForm((prev) => ({
                      ...prev,
                      isAdmin: event.target.checked
                    }))}
                  />
                  Tornar administrador
                </label>
              )}
              {actionError && (
                <div className="equipe__error equipe__error--inline">
                  {actionError}
                </div>
              )}
              <div className="equipe__modal-actions">
                <button
                  type="button"
                  className="equipe__button equipe__button--ghost"
                  onClick={closeMontadorModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="equipe__button"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Equipe
