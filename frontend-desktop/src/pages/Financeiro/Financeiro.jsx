import React, { useEffect, useMemo, useState } from 'react'
import {
  MdAccountBalanceWallet,
  MdAttachMoney,
  MdDelete,
  MdEdit,
  MdReceiptLong,
  MdSearch,
  MdExpandMore,
  MdChevronRight
} from 'react-icons/md'
import Card from '../../components/Card/Card'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../hooks/useApi'
import { useCurrency, useDate } from '../../hooks/useFormatters'
import api from '../../services/api'
import './Financeiro.css'

const parseDateOnly = (value) => {
  if (!value) return null

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const [, year, month, day] = match
      return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0)
    }
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDateOnlyPtBr = (value) => {
  const parsed = parseDateOnly(value)
  if (!parsed) return '-'
  return parsed.toLocaleDateString('pt-BR')
}

const Financeiro = () => {
  const [activeTab, setActiveTab] = useState('salarios')
  const [searchTerm, setSearchTerm] = useState('')
  const [salarioDebugMode, setSalarioDebugMode] = useState(false)
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false)
  const [isRecebimentoModalOpen, setIsRecebimentoModalOpen] = useState(false)
  const [editingDespesaId, setEditingDespesaId] = useState(null)
  const [expandedMontadores, setExpandedMontadores] = useState(() => new Set())
  const [expandedRecebimentos, setExpandedRecebimentos] = useState(() => new Set())
  const [editingRecebimentoGrupo, setEditingRecebimentoGrupo] = useState(null)
  const [recebimentoForm, setRecebimentoForm] = useState({
    status: 'pendente',
    valor_parcial: '',
    data_prevista: '',
    data_recebimento: '',
    forma_pagamento: '',
    observacoes: ''
  })
  const [despesaForm, setDespesaForm] = useState({
    categoria: 'Outros',
    valor: '',
    data_despesa: '',
    responsavel_id: '',
    descricao: ''
  })
  const { user } = useAuth()
  const isAdmin = user?.tipo === 'admin'
  const isMontador = user?.tipo === 'montador'
  const salariosEndpoint = isAdmin
    ? `/dashboard/salarios${salarioDebugMode ? '?debug=1' : ''}`
    : '/health'

  const { data: salariosData, loading: salariosLoading } = useApi(salariosEndpoint)
  const {
    data: recebimentosData,
    loading: recebimentosLoading,
    refetch: refetchRecebimentos
  } = useApi('/recebimentos', 'GET', [])
  const {
    data: despesasData,
    loading: despesasLoading,
    refetch: refetchDespesas
  } = useApi('/despesas', 'GET', [])
  const { data: usuariosData } = useApi('/usuarios', 'GET', [])
  const { data: servicosData } = useApi('/servicos', 'GET', [])
  const { data: servicoMontadoresData } = useApi('/servico_montadores', 'GET', [])
  const { data: equipeMembrosData } = useApi('/equipe_membros', 'GET', [])
  const { data: lojasData } = useApi('/lojas', 'GET', [])
  const { data: particularesData } = useApi('/clientes_particulares', 'GET', [])

  const { formatDate } = useDate()
  const formatCurrency = useCurrency()

  useEffect(() => {
    if (isMontador && activeTab !== 'recebimentos') {
      setActiveTab('recebimentos')
      setSearchTerm('')
    }
  }, [isMontador, activeTab])

  const isLoading = salariosLoading || recebimentosLoading || despesasLoading

  const usuariosMap = useMemo(() => {
    return (usuariosData || []).reduce((acc, usuario) => {
      acc[usuario.id] = usuario
      return acc
    }, {})
  }, [usuariosData])

  const responsaveisDespesasList = useMemo(() => {
    return (usuariosData || []).filter((usuario) =>
      usuario.tipo === 'admin' || usuario.tipo === 'montador' || usuario.tipo === null || usuario.tipo === ''
    )
  }, [usuariosData])

  const servicosMap = useMemo(() => {
    return (servicosData || []).reduce((acc, servico) => {
      acc[servico.id] = servico
      return acc
    }, {})
  }, [servicosData])

  const lojasMap = useMemo(() => {
    return (lojasData || []).reduce((acc, loja) => {
      acc[loja.id] = loja
      return acc
    }, {})
  }, [lojasData])

  const particularesMap = useMemo(() => {
    return (particularesData || []).reduce((acc, cliente) => {
      acc[cliente.id] = cliente
      return acc
    }, {})
  }, [particularesData])

  const periodoLabel = useMemo(() => {
    if (salariosData?.periodo?.mes && salariosData?.periodo?.ano) {
      return `${salariosData.periodo.mes} ${salariosData.periodo.ano}`
    }
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())
  }, [salariosData])

  const periodoInfo = useMemo(() => {
    if (salariosData?.periodo?.inicio && salariosData?.periodo?.fim) {
      return {
        inicio: parseDateOnly(salariosData.periodo.inicio),
        fim: parseDateOnly(salariosData.periodo.fim)
      }
    }

    if (salariosData?.periodo?.mes && salariosData?.periodo?.ano) {
      const monthMap = {
        Jan: 0,
        Fev: 1,
        Mar: 2,
        Abr: 3,
        Mai: 4,
        Jun: 5,
        Jul: 6,
        Ago: 7,
        Set: 8,
        Out: 9,
        Nov: 10,
        Dez: 11
      }

      return {
        inicio: new Date(Number(salariosData.periodo.ano), monthMap[salariosData.periodo.mes], 1),
        fim: new Date(Number(salariosData.periodo.ano), monthMap[salariosData.periodo.mes] + 1, 0)
      }
    }

    return null
  }, [salariosData])

  const searchNormalized = searchTerm.trim().toLowerCase()

  const salariosList = useMemo(() => {
    const montadores = salariosData?.montadores || []
    if (!searchNormalized) return montadores

    return montadores.filter((montador) =>
      montador.nome?.toLowerCase().includes(searchNormalized)
    )
  }, [salariosData, searchNormalized])

  const salarioDetalhado = useMemo(() => {
    const montadoresApi = Array.isArray(salariosData?.montadores) ? salariosData.montadores : []

    const montadores = montadoresApi
      .map((montador) => {
        const itens = (montador.detalhes || []).map((detalhe, index) => {
          const servico = servicosMap[detalhe.servico_id]
          const numeroOS = detalhe.codigo_os_loja || detalhe.codigo_servico || detalhe.servico_id?.slice(0, 8)
          const clienteLabel = servico?.tipo_cliente === 'loja'
            ? lojasMap[servico.loja_id]?.nome || lojasMap[servico.loja_id]?.nome_fantasia || 'Loja'
            : servico
              ? (particularesMap[servico.cliente_particular_id]?.nome || 'Particular')
              : 'Cliente'

          return {
            montadorId: montador.usuario_id,
            servicoId: detalhe.servico_id,
            numeroOS,
            data: detalhe.data_servico,
            clienteLabel,
            valorCheio: Number(detalhe.valor_cheio || 0),
            valorCalculadoCliente: Number(detalhe.valor_calculado || 0),
            valorMontador: Number(detalhe.valor_atribuido || 0),
            debug: detalhe._debug || null,
            assignmentKey: `${detalhe.servico_id}-${montador.usuario_id}-${index}`
          }
        })

        const totalMontador = itens.reduce((acc, item) => acc + item.valorMontador, 0)

        return {
          montadorId: montador.usuario_id,
          nome: montador.nome || 'Montador',
          itens,
          totalMontador
        }
      })
      .sort((a, b) => a.nome.localeCompare(b.nome))

    const totalPorServico = new Map()
    montadores.forEach((montador) => {
      montador.itens.forEach((item) => {
        if (!totalPorServico.has(item.servicoId)) {
          totalPorServico.set(item.servicoId, {
            valorCheio: item.valorCheio,
            valorCalculadoCliente: item.valorCalculadoCliente
          })
        }
      })
    })

    const totalCheio = Array.from(totalPorServico.values())
      .reduce((acc, item) => acc + Number(item.valorCheio || 0), 0)
    const totalCalculado = Array.from(totalPorServico.values())
      .reduce((acc, item) => acc + Number(item.valorCalculadoCliente || 0), 0)
    const totalMontadores = montadores.reduce((acc, montador) => acc + montador.totalMontador, 0)

    return {
      montadores,
      totalCheio,
      totalCalculado,
      totalMontadores
    }
  }, [salariosData, servicosMap, lojasMap, particularesMap])

  const recebimentosPorServico = useMemo(() => {
    const map = {}
    ;(Array.isArray(recebimentosData) ? recebimentosData : []).forEach((item) => {
      if (!item?.servico_id) return
      if (!map[item.servico_id]) {
        map[item.servico_id] = []
      }
      map[item.servico_id].push(item)
    })
    return map
  }, [recebimentosData])

  const recebimentosList = useMemo(() => {
    const servicosConcluidos = (Array.isArray(servicosData) ? servicosData : [])
      .filter((servico) => servico.status === 'concluido')

    const grupos = new Map()

    servicosConcluidos.forEach((servico) => {
      const isLoja = servico.tipo_cliente === 'loja' && servico.loja_id
      const clienteKey = isLoja
        ? `loja:${servico.loja_id}`
        : `particular:${servico.cliente_particular_id || 'sem-id'}`
      const clienteNome = isLoja
        ? (lojasMap[servico.loja_id]?.nome || lojasMap[servico.loja_id]?.nome_fantasia || 'Loja')
        : (particularesMap[servico.cliente_particular_id]?.nome || 'Cliente Particular')

      if (!grupos.has(clienteKey)) {
        grupos.set(clienteKey, {
          clienteKey,
          clienteNome,
          tipoCliente: isLoja ? 'loja' : 'particular',
          servicos: []
        })
      }

      grupos.get(clienteKey).servicos.push(servico)
    })

    const lista = Array.from(grupos.values()).map((grupo) => {
      const detalhesOs = grupo.servicos.map((servico) => {
        const registros = recebimentosPorServico[servico.id] || []
        const registro = registros[0] || null
        const valorRecebidoServico = registros.reduce((sum, item) => {
          if (!['recebido', 'parcial'].includes(item.status)) return sum
          return sum + Number(item.valor || 0)
        }, 0)

        return {
          servicoId: servico.id,
          numeroOS: servico.codigo_os_loja || servico.codigo_servico || servico.id?.slice(0, 8),
          valorTotal: Number(servico.valor_total || 0),
          valorRecebido: valorRecebidoServico,
          saldo: Math.max(Number(servico.valor_total || 0) - valorRecebidoServico, 0),
          status: registro?.status || (valorRecebidoServico > 0 ? 'parcial' : 'pendente'),
          dataPrevista: registro?.data_prevista || '',
          dataRecebimento: registro?.data_recebimento || '',
          formaPagamento: registro?.forma_pagamento || '',
          observacoes: registro?.observacoes || ''
        }
      })

      const totalPrevisto = grupo.servicos
        .reduce((acc, servico) => acc + Number(servico.valor_total || 0), 0)

      const totalRecebido = grupo.servicos.reduce((acc, servico) => {
        const registros = recebimentosPorServico[servico.id] || []
        const valorServicoRecebido = registros.reduce((sum, registro) => {
          if (!['recebido', 'parcial'].includes(registro.status)) return sum
          return sum + Number(registro.valor || 0)
        }, 0)
        return acc + valorServicoRecebido
      }, 0)

      let status = 'pendente'
      if (totalRecebido > 0 && totalRecebido + 0.01 < totalPrevisto) {
        status = 'parcial'
      } else if (totalPrevisto > 0 && totalRecebido + 0.01 >= totalPrevisto) {
        status = 'recebido'
      }

      return {
        ...grupo,
        detalhesOs,
        totalPrevisto,
        totalRecebido,
        saldo: Math.max(totalPrevisto - totalRecebido, 0),
        totalOs: grupo.servicos.length,
        status
      }
    })

    if (!searchNormalized) return lista

    return lista.filter((item) => {
      const codigosOs = item.servicos
        .map((servico) => servico.codigo_os_loja || servico.codigo_servico || servico.id?.slice(0, 8))
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const values = [item.clienteNome, item.status, item.tipoCliente, codigosOs]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return values.includes(searchNormalized)
    })
  }, [servicosData, lojasMap, particularesMap, recebimentosPorServico, searchNormalized])

  const despesasList = useMemo(() => {
    const list = Array.isArray(despesasData) ? despesasData : []
    if (!searchNormalized) return list

    return list.filter((item) => {
      const responsavel = usuariosMap[item.responsavel_id]
      const values = [item.descricao, item.categoria, responsavel?.nome]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return values.includes(searchNormalized)
    })
  }, [despesasData, searchNormalized, usuariosMap])

  const actionLabel = useMemo(() => {
    if (isMontador) {
      return ''
    }

    switch (activeTab) {
      case 'despesas':
        return 'Nova Despesa'
      default:
        return ''
    }
  }, [activeTab, isMontador])

  const totalSalarios = salariosData?.totais?.total_salarios || 0

  const handleActionClick = () => {
    if (activeTab === 'despesas') {
      setEditingDespesaId(null)
      setDespesaForm({
        categoria: 'Outros',
        valor: '',
        data_despesa: '',
        responsavel_id: '',
        descricao: ''
      })
      setIsDespesaModalOpen(true)
    }
  }

  const handleEditDespesa = (despesa) => {
    setEditingDespesaId(despesa.id)
    setDespesaForm({
      categoria: despesa.categoria || 'Outros',
      valor: despesa.valor != null ? String(despesa.valor) : '',
      data_despesa: despesa.data_despesa ? despesa.data_despesa.split('T')[0] : '',
      responsavel_id: despesa.responsavel_id || '',
      descricao: despesa.descricao || ''
    })
    setIsDespesaModalOpen(true)
  }

  const handleDeleteDespesa = async (despesa) => {
    const shouldDelete = window.confirm('Deseja remover esta despesa?')
    if (!shouldDelete) return

    try {
      await api.delete(`/despesas/${despesa.id}`)
      refetchDespesas()
    } catch (err) {
      alert(err.response?.data?.error || 'Não foi possível remover a despesa.')
    }
  }

  const handleOpenEditRecebimento = (grupo) => {
    const primeiraComDados = grupo.detalhesOs.find((item) =>
      item.dataPrevista || item.dataRecebimento || item.formaPagamento || item.observacoes
    ) || grupo.detalhesOs[0]

    setEditingRecebimentoGrupo(grupo)
    setRecebimentoForm({
      status: grupo.status || 'pendente',
      valor_parcial: Number(grupo.totalRecebido || 0).toFixed(2),
      data_prevista: (primeiraComDados?.dataPrevista || '').slice(0, 10),
      data_recebimento: (primeiraComDados?.dataRecebimento || '').slice(0, 10),
      forma_pagamento: primeiraComDados?.formaPagamento || '',
      observacoes: primeiraComDados?.observacoes || ''
    })
    setIsRecebimentoModalOpen(true)
  }

  const handleSubmitRecebimento = async (event) => {
    event.preventDefault()
    if (!editingRecebimentoGrupo) return

    const statusSelecionado = recebimentoForm.status || 'pendente'
    const totalPrevisto = Number(editingRecebimentoGrupo.totalPrevisto || 0)

    let totalParaDistribuir = 0
    if (statusSelecionado === 'recebido') {
      totalParaDistribuir = totalPrevisto
    } else if (statusSelecionado === 'parcial') {
      const valorParcial = Number(String(recebimentoForm.valor_parcial || '0').replace(',', '.'))
      if (Number.isNaN(valorParcial) || valorParcial < 0) {
        alert('Informe um valor parcial válido.')
        return
      }
      totalParaDistribuir = Math.min(valorParcial, totalPrevisto)
    }

    try {
      let restante = totalParaDistribuir

      for (const servico of editingRecebimentoGrupo.servicos) {
        const valorServico = Number(servico.valor_total || 0)
        const registros = recebimentosPorServico[servico.id] || []
        const registroExistente = registros[0] || null

        let valorRecebimento = 0
        let statusFinal = 'pendente'

        if (statusSelecionado === 'recebido') {
          valorRecebimento = valorServico
          statusFinal = 'recebido'
        } else if (statusSelecionado === 'parcial') {
          valorRecebimento = Math.max(0, Math.min(valorServico, restante))
          if (valorRecebimento + 0.01 >= valorServico) {
            statusFinal = 'recebido'
          } else if (valorRecebimento > 0) {
            statusFinal = 'parcial'
          }
          restante -= valorRecebimento
        }

        const payload = {
          servico_id: servico.id,
          valor: Number(valorRecebimento.toFixed(2)),
          data_prevista: recebimentoForm.data_prevista || null,
          data_recebimento: statusFinal === 'pendente' ? null : (recebimentoForm.data_recebimento || null),
          status: statusFinal,
          forma_pagamento: recebimentoForm.forma_pagamento || null,
          observacoes: recebimentoForm.observacoes || null
        }

        if (registroExistente?.id) {
          await api.put(`/recebimentos/${registroExistente.id}`, payload)
        } else {
          await api.post('/recebimentos', payload)
        }
      }

      setIsRecebimentoModalOpen(false)
      setEditingRecebimentoGrupo(null)
      refetchRecebimentos()
    } catch (err) {
      alert(err.response?.data?.error || 'Não foi possível atualizar o recebimento.')
    }
  }

  const handleDespesaSubmit = async (event) => {
    event.preventDefault()

    try {
      const payload = {
        descricao: despesaForm.descricao || 'Despesa registrada',
        categoria: despesaForm.categoria || null,
        valor: despesaForm.valor ? Number(despesaForm.valor) : 0,
        data_despesa: despesaForm.data_despesa,
        responsavel_id: despesaForm.responsavel_id || null
      }

      if (editingDespesaId) {
        await api.put(`/despesas/${editingDespesaId}`, payload)
      } else {
        await api.post('/despesas', payload)
      }

      setIsDespesaModalOpen(false)
      setEditingDespesaId(null)
      refetchDespesas()
    } catch (err) {
      alert(err.response?.data?.error || 'Não foi possível salvar a despesa.')
    }
  }

  return (
    <div className="financeiro">
      <div className="financeiro__header">
        <div>
          <h1 className="financeiro__title">Financeiro</h1>
          <p className="financeiro__subtitle">Controle de recebimentos e despesas</p>
        </div>
        {actionLabel && (
          <button className="financeiro__button" type="button" onClick={handleActionClick}>
            {actionLabel}
          </button>
        )}
      </div>

      <div className="financeiro__tabs">
        {!isMontador && (
          <button
            type="button"
            className={`financeiro__tab ${activeTab === 'salarios' ? 'financeiro__tab--active' : ''}`}
            onClick={() => {
              setActiveTab('salarios')
              setSearchTerm('')
            }}
          >
            <MdAccountBalanceWallet />
            Salários
          </button>
        )}
        <button
          type="button"
          className={`financeiro__tab ${activeTab === 'recebimentos' ? 'financeiro__tab--active' : ''}`}
          onClick={() => {
            setActiveTab('recebimentos')
            setSearchTerm('')
          }}
        >
          <MdAttachMoney />
          Recebimentos
        </button>
        {!isMontador && (
          <button
            type="button"
            className={`financeiro__tab ${activeTab === 'despesas' ? 'financeiro__tab--active' : ''}`}
            onClick={() => {
              setActiveTab('despesas')
              setSearchTerm('')
            }}
          >
            <MdReceiptLong />
            Despesas
          </button>
        )}
      </div>

      <div className="financeiro__toolbar">
        <div className="financeiro__search">
          <MdSearch className="financeiro__search-icon" />
          <input
            className="financeiro__search-input"
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="financeiro__loading">Carregando...</div>
      )}

      {!isLoading && !isMontador && activeTab === 'salarios' && (
        <Card
          title={`Salários - ${periodoLabel}`}
          extra={(
            <div className="financeiro__card-extra">
              <span className="financeiro__badge">100% do valor</span>
              <button
                type="button"
                className={`financeiro__debug-toggle ${salarioDebugMode ? 'financeiro__debug-toggle--active' : ''}`}
                onClick={() => setSalarioDebugMode((prev) => !prev)}
              >
                {salarioDebugMode ? 'Debug ligado' : 'Modo debug'}
              </button>
            </div>
          )}
          className="financeiro__card"
        >
          <div className="financeiro__summary">
            <span className="financeiro__summary-label">Total a pagar</span>
            <strong className="financeiro__summary-value">{formatCurrency(totalSalarios)}</strong>
            <span className="financeiro__summary-sub">
              Cheio: {formatCurrency(salarioDetalhado.totalCheio || 0)} · Calculado: {formatCurrency(salarioDetalhado.totalCalculado || 0)}
            </span>
          </div>

          {salarioDetalhado.montadores.length === 0 ? (
            <div className="financeiro__empty">Nenhum serviço concluído este mês</div>
          ) : (
            <div className="financeiro__accordion">
              {salarioDetalhado.montadores.map((montador) => {
                const isExpanded = expandedMontadores.has(montador.montadorId)
                return (
                  <div key={montador.montadorId} className="financeiro__accordion-item">
                    <button
                      type="button"
                      className="financeiro__accordion-header"
                      onClick={() => {
                        const next = new Set(expandedMontadores)
                        if (next.has(montador.montadorId)) {
                          next.delete(montador.montadorId)
                        } else {
                          next.add(montador.montadorId)
                        }
                        setExpandedMontadores(next)
                      }}
                    >
                      <span className="financeiro__accordion-title">
                        {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
                        {montador.nome}
                      </span>
                      <span className="financeiro__accordion-value">
                        {formatCurrency(montador.totalMontador)}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="financeiro__accordion-body">
                        <div className="financeiro__table-wrapper">
                          <table className="financeiro__table">
                            <thead>
                              <tr>
                                <th>Data</th>
                                <th>Nº OS</th>
                                <th>Cliente</th>
                                <th>Valor Total</th>
                                <th>Valor calculado</th>
                                <th>Valor montador</th>
                              </tr>
                            </thead>
                            <tbody>
                              {montador.itens.map((item) => (
                                <React.Fragment key={item.assignmentKey}>
                                  <tr>
                                    <td>{formatDateOnlyPtBr(item.data)}</td>
                                    <td className="financeiro__muted">{item.numeroOS}</td>
                                    <td>{item.clienteLabel}</td>
                                    <td>{formatCurrency(item.valorCheio)}</td>
                                    <td>{formatCurrency(item.valorCalculadoCliente)}</td>
                                    <td>{formatCurrency(item.valorMontador)}</td>
                                  </tr>
                                  {salarioDebugMode && item.debug && (
                                    <tr className="financeiro__debug-row">
                                      <td colSpan={6}>
                                        <div className="financeiro__debug-line">Etapa 1: {item.debug.etapa1_fonte || '-'} | Base: {formatCurrency(Number(item.debug.etapa1_valor_base || 0))}</div>
                                        <div className="financeiro__debug-line">Etapa 2: {item.debug.etapa2_metodo || '-'} | {item.debug.etapa2_formula || '-'}</div>
                                        <div className="financeiro__debug-line">Etapa 3: {item.debug.etapa3_formula || 'Sem divisão de equipe'}</div>
                                        <div className="financeiro__debug-line">Etapa 4: {item.debug.etapa4_formula || '-'} | Final: {formatCurrency(Number(item.debug.etapa4_valor_final || 0))}</div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                              <tr className="financeiro__table-total">
                                <td colSpan={5}>Total salário do montador</td>
                                <td>{formatCurrency(montador.totalMontador)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="financeiro__total-footer">
                <span>Total a pagar</span>
                <span className="financeiro__total-values">
                  Total: {formatCurrency(salarioDetalhado.totalCheio || 0)} · Calculado: {formatCurrency(salarioDetalhado.totalCalculado || 0)}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {!isLoading && activeTab === 'recebimentos' && (
        <Card title="Recebimentos" className="financeiro__card">
          {recebimentosList.length === 0 ? (
            <div className="financeiro__empty">Nenhum serviço concluído para recebimento</div>
          ) : (
            <div className="financeiro__table-wrapper">
              <table className="financeiro__table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>OS Concluídas</th>
                    <th>Status</th>
                    <th>Total OS</th>
                    <th>Recebido</th>
                    <th>Saldo</th>
                    {isAdmin && <th>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {recebimentosList.map((item) => (
                    <React.Fragment key={item.clienteKey}>
                      <tr>
                        <td>
                          <button
                            type="button"
                            className="financeiro__expand-btn"
                            onClick={() => {
                              const next = new Set(expandedRecebimentos)
                              if (next.has(item.clienteKey)) {
                                next.delete(item.clienteKey)
                              } else {
                                next.add(item.clienteKey)
                              }
                              setExpandedRecebimentos(next)
                            }}
                          >
                            {expandedRecebimentos.has(item.clienteKey) ? <MdExpandMore /> : <MdChevronRight />}
                            <strong>{item.clienteNome}</strong>
                          </button>
                        </td>
                        <td>{item.totalOs}</td>
                        <td>
                          <span className={`financeiro__status financeiro__status--${item.status || 'pendente'}`}>
                            {item.status || 'pendente'}
                          </span>
                        </td>
                        <td>{formatCurrency(Number(item.totalPrevisto || 0))}</td>
                        <td>{formatCurrency(Number(item.totalRecebido || 0))}</td>
                        <td>{formatCurrency(Number(item.saldo || 0))}</td>
                        {isAdmin && (
                          <td>
                            <button
                              type="button"
                              className="financeiro__icon-btn financeiro__icon-btn--edit"
                              onClick={() => handleOpenEditRecebimento(item)}
                              title="Editar recebimento"
                            >
                              <MdEdit />
                            </button>
                          </td>
                        )}
                      </tr>
                      {expandedRecebimentos.has(item.clienteKey) && (
                        <tr className="financeiro__detail-row">
                          <td colSpan={isAdmin ? 7 : 6}>
                            <div className="financeiro__detail-box">
                              <table className="financeiro__table financeiro__table--compact">
                                <thead>
                                  <tr>
                                    <th>OS</th>
                                    <th>Valor OS</th>
                                    <th>Recebido</th>
                                    <th>Saldo</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.detalhesOs.map((osItem) => (
                                    <tr key={osItem.servicoId}>
                                      <td className="financeiro__muted">{osItem.numeroOS}</td>
                                      <td>{formatCurrency(Number(osItem.valorTotal || 0))}</td>
                                      <td>{formatCurrency(Number(osItem.valorRecebido || 0))}</td>
                                      <td>{formatCurrency(Number(osItem.saldo || 0))}</td>
                                      <td>
                                        <span className={`financeiro__status financeiro__status--${osItem.status || 'pendente'}`}>
                                          {osItem.status || 'pendente'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {!isLoading && !isMontador && activeTab === 'despesas' && (
        <Card title="Despesas" className="financeiro__card">
          {despesasList.length === 0 ? (
            <div className="financeiro__empty">Nenhuma despesa</div>
          ) : (
            <div className="financeiro__table-wrapper">
              <table className="financeiro__table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Responsável</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {despesasList.map((item) => (
                    <tr key={item.id}>
                      <td>{item.descricao}</td>
                      <td>{item.categoria || '-'}</td>
                      <td>{usuariosMap[item.responsavel_id]?.nome || '-'}</td>
                      <td>{formatCurrency(Number(item.valor || 0))}</td>
                      <td>{formatDate(item.data_despesa)}</td>
                      <td>
                        <div className="financeiro__row-actions">
                          <button
                            type="button"
                            className="financeiro__icon-btn financeiro__icon-btn--edit"
                            onClick={() => handleEditDespesa(item)}
                            title="Editar despesa"
                          >
                            <MdEdit />
                          </button>
                          <button
                            type="button"
                            className="financeiro__icon-btn financeiro__icon-btn--delete"
                            onClick={() => handleDeleteDespesa(item)}
                            title="Remover despesa"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {!isMontador && isDespesaModalOpen && (
        <div className="financeiro__modal-backdrop" onClick={() => setIsDespesaModalOpen(false)}>
          <div className="financeiro__modal" onClick={(event) => event.stopPropagation()}>
            <div className="financeiro__modal-header">
              <h3>{editingDespesaId ? 'Editar Despesa' : 'Nova Despesa'}</h3>
              <button
                type="button"
                className="financeiro__modal-close"
                onClick={() => {
                  setIsDespesaModalOpen(false)
                  setEditingDespesaId(null)
                }}
              >
                ×
              </button>
            </div>

            <form className="financeiro__modal-form" onSubmit={handleDespesaSubmit}>
              <div className="financeiro__form-grid">
                <label className="financeiro__label">
                  Categoria
                  <select
                    className="financeiro__input"
                    value={despesaForm.categoria}
                    onChange={(event) => setDespesaForm((prev) => ({
                      ...prev,
                      categoria: event.target.value
                    }))}
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Combustível">Combustível</option>
                    <option value="Ferramentas">Ferramentas</option>
                    <option value="Materiais">Materiais</option>
                    <option value="Salário">Salário</option>
                    <option value="Outros">Outros</option>
                  </select>
                </label>

                <label className="financeiro__label">
                  Valor (R$)
                  <input
                    className="financeiro__input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={despesaForm.valor}
                    onChange={(event) => setDespesaForm((prev) => ({
                      ...prev,
                      valor: event.target.value
                    }))}
                    required
                  />
                </label>

                <label className="financeiro__label">
                  Data
                  <input
                    className="financeiro__input"
                    type="date"
                    value={despesaForm.data_despesa}
                    onChange={(event) => setDespesaForm((prev) => ({
                      ...prev,
                      data_despesa: event.target.value
                    }))}
                    required
                  />
                </label>

                <label className="financeiro__label">
                  Responsável
                  <select
                    className="financeiro__input"
                    value={despesaForm.responsavel_id}
                    onChange={(event) => setDespesaForm((prev) => ({
                      ...prev,
                      responsavel_id: event.target.value
                    }))}
                  >
                    <option value="">Nenhum</option>
                    {responsaveisDespesasList.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="financeiro__label">
                Descrição
                <input
                  className="financeiro__input"
                  type="text"
                  placeholder="Detalhes da despesa"
                  value={despesaForm.descricao}
                  onChange={(event) => setDespesaForm((prev) => ({
                    ...prev,
                    descricao: event.target.value
                  }))}
                />
              </label>

              <div className="financeiro__modal-actions">
                <button
                  type="button"
                  className="financeiro__button financeiro__button--ghost"
                  onClick={() => {
                    setIsDespesaModalOpen(false)
                    setEditingDespesaId(null)
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="financeiro__button">
                  {editingDespesaId ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isMontador && isRecebimentoModalOpen && editingRecebimentoGrupo && (
        <div className="financeiro__modal-backdrop" onClick={() => setIsRecebimentoModalOpen(false)}>
          <div className="financeiro__modal" onClick={(event) => event.stopPropagation()}>
            <div className="financeiro__modal-header">
              <h3>Editar Recebimento - {editingRecebimentoGrupo.clienteNome}</h3>
              <button
                type="button"
                className="financeiro__modal-close"
                onClick={() => {
                  setIsRecebimentoModalOpen(false)
                  setEditingRecebimentoGrupo(null)
                }}
              >
                ×
              </button>
            </div>

            <form className="financeiro__modal-form" onSubmit={handleSubmitRecebimento}>
              <div className="financeiro__form-grid">
                <label className="financeiro__label">
                  Status
                  <select
                    className="financeiro__input"
                    value={recebimentoForm.status}
                    onChange={(event) => setRecebimentoForm((prev) => ({
                      ...prev,
                      status: event.target.value
                    }))}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="parcial">Parcial</option>
                    <option value="recebido">Recebido</option>
                  </select>
                </label>

                {recebimentoForm.status === 'parcial' && (
                  <label className="financeiro__label">
                    Valor Parcial (R$)
                    <input
                      className="financeiro__input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={recebimentoForm.valor_parcial}
                      onChange={(event) => setRecebimentoForm((prev) => ({
                        ...prev,
                        valor_parcial: event.target.value
                      }))}
                      required
                    />
                  </label>
                )}

                <label className="financeiro__label">
                  Data Prevista
                  <input
                    className="financeiro__input"
                    type="date"
                    value={recebimentoForm.data_prevista}
                    onChange={(event) => setRecebimentoForm((prev) => ({
                      ...prev,
                      data_prevista: event.target.value
                    }))}
                  />
                </label>

                <label className="financeiro__label">
                  Data de Recebimento
                  <input
                    className="financeiro__input"
                    type="date"
                    value={recebimentoForm.data_recebimento}
                    onChange={(event) => setRecebimentoForm((prev) => ({
                      ...prev,
                      data_recebimento: event.target.value
                    }))}
                  />
                </label>

                <label className="financeiro__label">
                  Forma de Pagamento
                  <select
                    className="financeiro__input"
                    value={recebimentoForm.forma_pagamento}
                    onChange={(event) => setRecebimentoForm((prev) => ({
                      ...prev,
                      forma_pagamento: event.target.value
                    }))}
                  >
                    <option value="">Selecione</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </label>
              </div>

              <label className="financeiro__label">
                Observações
                <textarea
                  className="financeiro__input financeiro__textarea"
                  rows={3}
                  value={recebimentoForm.observacoes}
                  onChange={(event) => setRecebimentoForm((prev) => ({
                    ...prev,
                    observacoes: event.target.value
                  }))}
                  placeholder="Detalhes do recebimento"
                />
              </label>

              <div className="financeiro__modal-actions">
                <button
                  type="button"
                  className="financeiro__button financeiro__button--ghost"
                  onClick={() => {
                    setIsRecebimentoModalOpen(false)
                    setEditingRecebimentoGrupo(null)
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="financeiro__button">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Financeiro
