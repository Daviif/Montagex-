import React, { useMemo, useState } from 'react'
import {
  MdAccountBalanceWallet,
  MdAttachMoney,
  MdPayments,
  MdReceiptLong,
  MdSearch,
  MdExpandMore,
  MdChevronRight
} from 'react-icons/md'
import Card from '../../components/Card/Card'
import { useApi } from '../../hooks/useApi'
import { useCurrency, useDate } from '../../hooks/useFormatters'
import api from '../../services/api'
import './Financeiro.css'

const Financeiro = () => {
  const [activeTab, setActiveTab] = useState('salarios')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false)
  const [expandedMontadores, setExpandedMontadores] = useState(() => new Set())
  const [despesaForm, setDespesaForm] = useState({
    categoria: 'Outros',
    valor: '',
    data_despesa: '',
    responsavel_id: '',
    descricao: ''
  })

  const { data: salariosData, loading: salariosLoading } = useApi('/dashboard/salarios')
  const { data: recebimentosData, loading: recebimentosLoading } = useApi('/recebimentos', 'GET', [])
  const { data: pagamentosData, loading: pagamentosLoading } = useApi('/pagamentos_funcionarios', 'GET', [])
  const {
    data: despesasData,
    loading: despesasLoading,
    refetch: refetchDespesas
  } = useApi('/despesas', 'GET', [])
  const { data: usuariosData } = useApi('/usuarios', 'GET', [])
  const { data: servicosData } = useApi('/servicos', 'GET', [])
  const { data: servicoMontadoresData } = useApi('/servico_montadores', 'GET', [])
  const { data: lojasData } = useApi('/lojas', 'GET', [])
  const { data: particularesData } = useApi('/clientes_particulares', 'GET', [])

  const { formatDate } = useDate()
  const formatCurrency = useCurrency()

  const isLoading = salariosLoading || recebimentosLoading || pagamentosLoading || despesasLoading

  const usuariosMap = useMemo(() => {
    return (usuariosData || []).reduce((acc, usuario) => {
      acc[usuario.id] = usuario
      return acc
    }, {})
  }, [usuariosData])

  const montadoresList = useMemo(() => {
    return (usuariosData || []).filter((usuario) =>
      usuario.tipo === 'montador' || usuario.tipo === null || usuario.tipo === ''
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
        inicio: new Date(salariosData.periodo.inicio),
        fim: new Date(salariosData.periodo.fim)
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
    const montadoresMap = new Map()
    const montadoresPorServico = new Map()
    const hasServicoMontadores = Array.isArray(servicoMontadoresData) && servicoMontadoresData.length > 0
    const servicosList = Array.isArray(servicosData) ? servicosData : []
    const servicosConcluidos = servicosList.filter((servico) => {
      if (servico.status !== 'concluido') return false
      if (!periodoInfo) return true
      const data = new Date(servico.data_servico)
      return data >= periodoInfo.inicio && data <= periodoInfo.fim
    })

    servicosConcluidos.forEach((servico) => {
      const count = (servicoMontadoresData || []).filter((sm) => sm.servico_id === servico.id && sm.usuario_id).length
      montadoresPorServico.set(servico.id, count || 1)
    })

    const servicosConcluidosMap = servicosConcluidos.reduce((acc, servico) => {
      acc[servico.id] = servico
      return acc
    }, {})

    const salarySource = hasServicoMontadores
      ? (servicoMontadoresData || []).filter((sm) => sm.usuario_id && servicosConcluidosMap[sm.servico_id])
      : (salariosData?.montadores || []).flatMap((montador) =>
          (montador.detalhes || []).map((detalhe) => ({
            ...detalhe,
            usuario_id: montador.usuario_id,
            servico_id: detalhe.servico_id
          }))
        )

    const entries = salarySource.map((sm) => {
      const servico = servicosConcluidosMap[sm.servico_id] || servicosMap[sm.servico_id]
      const loja = servico?.tipo_cliente === 'loja' ? lojasMap[servico.loja_id] : null
      const valorCheio = Number(servico?.valor_total || servico?.valor_repasse_montagem || sm.valor_atribuido || 0)
      const valorCalculadoCliente = loja?.usa_porcentagem
        && loja?.porcentagem_repasse != null
        && Number(loja.porcentagem_repasse) > 0
        ? (valorCheio * Number(loja.porcentagem_repasse)) / 100
        : valorCheio
      const totalMontadores = montadoresPorServico.get(sm.servico_id) || 1
      const valorMontador = sm.valor_atribuido != null
        ? Number(sm.valor_atribuido)
        : sm.percentual_divisao
          ? (valorCalculadoCliente * Number(sm.percentual_divisao)) / 100
          : valorCalculadoCliente / totalMontadores

      return {
        montadorId: sm.usuario_id,
        servicoId: sm.servico_id,
        data: servico?.data_servico || sm.data_servico || sm.data,
        clienteLabel: servico?.tipo_cliente === 'loja'
          ? lojasMap[servico.loja_id]?.nome || lojasMap[servico.loja_id]?.nome_fantasia || 'Loja'
          : servico
            ? (particularesMap[servico.cliente_particular_id]?.nome || 'Particular')
            : 'Cliente',
        valorCheio,
        valorCalculadoCliente,
        valorMontador
      }
    })

    entries.forEach((entry) => {
      if (!montadoresMap.has(entry.montadorId)) {
        montadoresMap.set(entry.montadorId, {
          montadorId: entry.montadorId,
          nome: usuariosMap[entry.montadorId]?.nome || 'Montador',
          itens: [],
          totalCheio: 0,
          totalCalculado: 0,
          totalMontador: 0
        })
      }

      const montador = montadoresMap.get(entry.montadorId)
      montador.itens.push(entry)
      montador.totalCheio += entry.valorCheio
      montador.totalCalculado += entry.valorCalculadoCliente
      montador.totalMontador += entry.valorMontador
    })

    const montadores = Array.from(montadoresMap.values())
      .sort((a, b) => a.nome.localeCompare(b.nome))

    const uniqueServicoIds = new Set(entries.map((entry) => entry.servicoId))
    const totalCheio = servicosConcluidos.length > 0
      ? servicosConcluidos.reduce((acc, servico) => {
          return acc + Number(servico.valor_total || servico.valor_repasse_montagem || 0)
        }, 0)
      : Array.from(uniqueServicoIds).reduce((acc, servicoId) => {
          const servico = servicosMap[servicoId]
          return acc + Number(servico?.valor_total || servico?.valor_repasse_montagem || 0)
        }, 0)

    const totalCalculado = servicosConcluidos.length > 0
      ? servicosConcluidos.reduce((acc, servico) => {
          const loja = servico.tipo_cliente === 'loja' ? lojasMap[servico.loja_id] : null
          const valorCheio = Number(servico.valor_total || servico.valor_repasse_montagem || 0)
          const valorCalculadoCliente = loja?.usa_porcentagem
            && loja?.porcentagem_repasse != null
            && Number(loja.porcentagem_repasse) > 0
            ? (valorCheio * Number(loja.porcentagem_repasse)) / 100
            : valorCheio
          return acc + valorCalculadoCliente
        }, 0)
      : Array.from(uniqueServicoIds).reduce((acc, servicoId) => {
          const servico = servicosMap[servicoId]
          if (!servico) return acc
          const loja = servico.tipo_cliente === 'loja' ? lojasMap[servico.loja_id] : null
          const valorCheio = Number(servico.valor_total || servico.valor_repasse_montagem || 0)
          const valorCalculadoCliente = loja?.usa_porcentagem && loja?.porcentagem_repasse != null
            ? (valorCheio * Number(loja.porcentagem_repasse)) / 100
            : valorCheio
          return acc + valorCalculadoCliente
        }, 0)

    const totalMontadores = montadores.reduce((acc, montador) => acc + montador.totalMontador, 0)

    return {
      montadores,
      totalCheio,
      totalCalculado,
      totalMontadores
    }
  }, [servicosData, servicoMontadoresData, lojasMap, particularesMap, usuariosMap, periodoInfo, salariosData, servicosMap])

  const recebimentosList = useMemo(() => {
    const list = Array.isArray(recebimentosData) ? recebimentosData : []
    if (!searchNormalized) return list

    return list.filter((item) => {
      const servico = servicosMap[item.servico_id]
      const values = [
        item.status,
        item.forma_pagamento,
        servico?.codigo_servico,
        servico?.endereco_execucao,
        item.servico_id
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return values.includes(searchNormalized)
    })
  }, [recebimentosData, searchNormalized, servicosMap])

  const pagamentosList = useMemo(() => {
    const list = Array.isArray(pagamentosData) ? pagamentosData : []
    if (!searchNormalized) return list

    return list.filter((item) => {
      const usuario = usuariosMap[item.usuario_id]
      const servico = servicosMap[item.servico_id]
      const values = [
        item.status,
        usuario?.nome,
        servico?.codigo_servico,
        servico?.endereco_execucao,
        item.servico_id
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return values.includes(searchNormalized)
    })
  }, [pagamentosData, searchNormalized, usuariosMap, servicosMap])

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
    switch (activeTab) {
      case 'recebimentos':
        return 'Novo Recebimento'
      case 'pagamentos':
        return 'Novo Pagamento'
      case 'despesas':
        return 'Nova Despesa'
      default:
        return ''
    }
  }, [activeTab])

  const totalSalarios = salariosData?.totais?.total_salarios || 0

  const handleActionClick = () => {
    if (activeTab === 'despesas') {
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

  const handleDespesaSubmit = async (event) => {
    event.preventDefault()

    try {
      await api.post('/despesas', {
        descricao: despesaForm.descricao || 'Despesa registrada',
        categoria: despesaForm.categoria || null,
        valor: despesaForm.valor ? Number(despesaForm.valor) : 0,
        data_despesa: despesaForm.data_despesa,
        responsavel_id: despesaForm.responsavel_id || null
      })

      setIsDespesaModalOpen(false)
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
          <p className="financeiro__subtitle">Controle de recebimentos, pagamentos e despesas</p>
        </div>
        {actionLabel && (
          <button className="financeiro__button" type="button" onClick={handleActionClick}>
            {actionLabel}
          </button>
        )}
      </div>

      <div className="financeiro__tabs">
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
        <button
          type="button"
          className={`financeiro__tab ${activeTab === 'pagamentos' ? 'financeiro__tab--active' : ''}`}
          onClick={() => {
            setActiveTab('pagamentos')
            setSearchTerm('')
          }}
        >
          <MdPayments />
          Pagamentos
        </button>
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

      {!isLoading && activeTab === 'salarios' && (
        <Card
          title={`Salários - ${periodoLabel}`}
          extra={<span className="financeiro__badge">100% do valor</span>}
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
                                <th>Cliente</th>
                                <th>Valor Total</th>
                                <th>Valor calculado</th>
                                <th>Valor montador</th>
                              </tr>
                            </thead>
                            <tbody>
                              {montador.itens.map((item) => (
                                <tr key={item.servicoId}>
                                  <td>{formatDate(item.data)}</td>
                                  <td>{item.clienteLabel}</td>
                                  <td>{formatCurrency(item.valorCheio)}</td>
                                  <td>{formatCurrency(item.valorCalculadoCliente)}</td>
                                  <td>{formatCurrency(item.valorMontador)}</td>
                                </tr>
                              ))}
                              <tr className="financeiro__table-total">
                                <td colSpan={4}>Total salário do montador</td>
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
            <div className="financeiro__empty">Nenhum recebimento</div>
          ) : (
            <div className="financeiro__table-wrapper">
              <table className="financeiro__table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Valor</th>
                    <th>Previsão</th>
                    <th>Recebido em</th>
                    <th>Serviço</th>
                  </tr>
                </thead>
                <tbody>
                  {recebimentosList.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className={`financeiro__status financeiro__status--${item.status || 'pendente'}`}>
                          {item.status || 'pendente'}
                        </span>
                      </td>
                      <td>{formatCurrency(Number(item.valor || 0))}</td>
                      <td>{formatDate(item.data_prevista)}</td>
                      <td>{formatDate(item.data_recebimento)}</td>
                      <td className="financeiro__muted">
                        {servicosMap[item.servico_id]?.codigo_servico || item.servico_id?.slice(0, 8)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {!isLoading && activeTab === 'pagamentos' && (
        <Card title="Pagamentos" className="financeiro__card">
          {pagamentosList.length === 0 ? (
            <div className="financeiro__empty">Nenhum pagamento</div>
          ) : (
            <div className="financeiro__table-wrapper">
              <table className="financeiro__table">
                <thead>
                  <tr>
                    <th>Montador</th>
                    <th>Status</th>
                    <th>Valor</th>
                    <th>Pago em</th>
                    <th>Serviço</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosList.map((item) => (
                    <tr key={item.id}>
                      <td>{usuariosMap[item.usuario_id]?.nome || 'Não informado'}</td>
                      <td>
                        <span className={`financeiro__status financeiro__status--${item.status || 'pendente'}`}>
                          {item.status || 'pendente'}
                        </span>
                      </td>
                      <td>{formatCurrency(Number(item.valor || 0))}</td>
                      <td>{formatDate(item.data_pagamento)}</td>
                      <td className="financeiro__muted">
                        {servicosMap[item.servico_id]?.codigo_servico || item.servico_id?.slice(0, 8)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {!isLoading && activeTab === 'despesas' && (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {isDespesaModalOpen && (
        <div className="financeiro__modal-backdrop" onClick={() => setIsDespesaModalOpen(false)}>
          <div className="financeiro__modal" onClick={(event) => event.stopPropagation()}>
            <div className="financeiro__modal-header">
              <h3>Nova Despesa</h3>
              <button
                type="button"
                className="financeiro__modal-close"
                onClick={() => setIsDespesaModalOpen(false)}
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
                    {montadoresList.map((montador) => (
                      <option key={montador.id} value={montador.id}>
                        {montador.nome}
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
                  onClick={() => setIsDespesaModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="financeiro__button">
                  Cadastrar
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
