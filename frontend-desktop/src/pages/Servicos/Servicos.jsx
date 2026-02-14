import React, { useState, useMemo, useCallback } from 'react';
import {
  MdAdd,
  MdClose,
  MdDelete,
  MdEdit,
  MdSearch
} from 'react-icons/md';
import { useApi } from '../../hooks/useApi';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import Card from '../../components/Card/Card';
import StatCard from '../../components/StatCard/StatCard';
import './Servicos.css';

const Servicos = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.tipo === 'admin';

  // Data fetching
  const { data: servicos, loading: servicosLoading, refetch: refetchServicos } = useApi('/servicos');
  const { data: lojas, loading: lojasLoading } = useApi('/lojas');
  const { data: particular, loading: particularLoading } = useApi('/clientes_particulares');
  const { data: usuarios, loading: usuariosLoading } = useApi('/usuarios');
  const { data: produtos, loading: produtosLoading } = useApi('/produtos');
  const { data: servicoProdutos, loading: servicoProdutosLoading } = useApi('/servico_produtos');
  const { data: servicoMontadores, loading: servicoMontadoresLoading } = useApi('/servico_montadores');

  // UI State
  const [statusFilter, setStatusFilter] = useState('todos');
  const [clienteFilter, setClienteFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [tabProdutos, setTabProdutos] = useState([]);
  const [tabMontadores, setTabMontadores] = useState([]);
  const [searchProduto, setSearchProduto] = useState('');
  const [categoriaProduto, setCategoriaProduto] = useState('');
  const [formData, setFormData] = useState({
    data_servico: '',
    tipo_cliente: 'loja',
    loja_id: '',
    cliente_particular_id: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado: '',
    endereco_cep: '',
    latitude: '',
    longitude: '',
    prioridade: 0,
    janela_inicio: '',
    janela_fim: '',
    observacoes: '',
    status: 'agendado'
  });

  // Memoized maps for fast lookups
  const lojasById = useMemo(() => {
    const map = {};
    if (lojas) {
      lojas.forEach(l => {
        map[l.id] = l;
      });
    }
    return map;
  }, [lojas]);

  const particularById = useMemo(() => {
    const map = {};
    if (particular) {
      particular.forEach(p => {
        map[p.id] = p;
      });
    }
    return map;
  }, [particular]);

  const usuariosById = useMemo(() => {
    const map = {};
    if (usuarios) {
      usuarios.forEach(u => {
        map[u.id] = u;
      });
    }
    return map;
  }, [usuarios]);

  const produtosById = useMemo(() => {
    const map = {};
    if (produtos) {
      produtos.forEach(p => {
        map[p.id] = p;
      });
    }
    return map;
  }, [produtos]);

  // Filter servicos by status
  const filteredServicos = useMemo(() => {
    if (!servicos) return [];
    return servicos.filter(s => {
      const matchStatus = statusFilter === 'todos' || s.status === statusFilter;
      const matchCliente = clienteFilter === 'todos' || s.tipo_cliente === clienteFilter;
      const matchSearch = searchTerm === '' || 
        s.endereco_execucao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchCliente && matchSearch;
    });
  }, [servicos, statusFilter, clienteFilter, searchTerm]);

  // Produtos da loja filtrados (ou todos se particular)
  const produtosFilterados = useMemo(() => {
    if (!produtos) return [];
    
    // Se for particular, mostrar todos os produtos
    if (formData.tipo_cliente === 'particular') {
      return produtos.filter(p => {
        const matchCategoria = categoriaProduto === '' || (p.categoria && p.categoria.toLowerCase() === categoriaProduto.toLowerCase());
        const matchSearch = searchProduto === '' || p.nome.toLowerCase().includes(searchProduto.toLowerCase());
        return matchCategoria && matchSearch;
      });
    }
    
    // Se for loja, filtrar por loja_id
    if (!formData.loja_id) return [];
    
    return produtos.filter(p => {
      const matchLoja = p.loja_id === formData.loja_id;
      const matchCategoria = categoriaProduto === '' || (p.categoria && p.categoria.toLowerCase() === categoriaProduto.toLowerCase());
      const matchSearch = searchProduto === '' || p.nome.toLowerCase().includes(searchProduto.toLowerCase());
      
      return matchLoja && matchCategoria && matchSearch;
    });
  }, [produtos, formData.loja_id, formData.tipo_cliente, categoriaProduto, searchProduto]);

  // Categorias únicas (de todos os produtos se particular, ou só da loja se loja)
  const categoriasLoja = useMemo(() => {
    if (!produtos) return [];
    
    const cats = new Set();
    let relevantProducts = [];
    
    if (formData.tipo_cliente === 'particular') {
      relevantProducts = produtos;
    } else if (formData.loja_id) {
      relevantProducts = produtos.filter(p => p.loja_id === formData.loja_id);
    }
    
    relevantProducts.forEach(p => {
      if (p.categoria) cats.add(p.categoria);
    });
    
    return Array.from(cats).sort();
  }, [produtos, formData.loja_id, formData.tipo_cliente]);

  // Stats
  const stats = useMemo(() => {
    if (!servicos) return { total: 0, agendado: 0, em_rota: 0, concluido: 0, cancelado: 0 };
    return {
      total: servicos.length,
      agendado: servicos.filter(s => s.status === 'agendado').length,
      em_rota: servicos.filter(s => s.status === 'em_rota').length,
      concluido: servicos.filter(s => s.status === 'concluido').length,
      cancelado: servicos.filter(s => s.status === 'cancelado').length
    };
  }, [servicos]);

  // Get cliente info
  const getClienteInfo = useCallback((servico) => {
    if (servico.tipo_cliente === 'loja' && servico.loja_id) {
      const loja = lojasById[servico.loja_id];
      return {
        nome: loja?.nome || loja?.nome_fantasia || loja?.razao_social || 'Sem nome',
        cpf_cnpj: loja?.cnpj || '-'
      };
    } else if (servico.tipo_cliente === 'particular' && servico.cliente_particular_id) {
      const part = particularById[servico.cliente_particular_id];
      return {
        nome: part?.nome || 'Sem nome',
        cpf_cnpj: part?.cpf || '-'
      };
    }
    return { nome: 'Cliente não encontrado', cpf_cnpj: '-' };
  }, [lojasById, particularById]);

  // Get servico produtos
  const getServicoProdutos = useCallback((servicoId) => {
    if (!servicoProdutos) return [];
    return servicoProdutos.filter(sp => sp.servico_id === servicoId);
  }, [servicoProdutos]);

  // Get servico montadores
  const getServicoMontadores = useCallback((servicoId) => {
    if (!servicoMontadores) return [];
    return servicoMontadores.filter(sm => sm.servico_id === servicoId);
  }, [servicoMontadores]);

  // Open edit modal
  const handleEdit = useCallback((servico) => {
    const enderecoParts = (servico.endereco_execucao || '').split(',').map(part => part.trim());
    setFormData({
      data_servico: servico.data_servico || '',
      tipo_cliente: servico.tipo_cliente || 'loja',
      loja_id: servico.loja_id || '',
      cliente_particular_id: servico.cliente_particular_id || '',
      endereco_rua: enderecoParts[0] || servico.endereco_execucao || '',
      endereco_numero: enderecoParts[1] || '',
      endereco_bairro: enderecoParts[2] || '',
      endereco_cidade: enderecoParts[3] || '',
      endereco_estado: enderecoParts[4] || '',
      endereco_cep: enderecoParts[5] || '',
      latitude: servico.latitude || '',
      longitude: servico.longitude || '',
      prioridade: servico.prioridade || 0,
      janela_inicio: servico.janela_inicio || '',
      janela_fim: servico.janela_fim || '',
      observacoes: servico.observacoes || '',
      status: servico.status || 'agendado'
    });
    setTabProdutos(getServicoProdutos(servico.id));
    setTabMontadores(getServicoMontadores(servico.id));
    setEditingId(servico.id);
    setShowModal(true);
  }, [getServicoProdutos, getServicoMontadores]);

  // Create new
  const handleNew = useCallback(() => {
    setFormData({
      data_servico: '',
      tipo_cliente: 'loja',
      loja_id: '',
      cliente_particular_id: '',
      endereco_rua: '',
      endereco_numero: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_estado: '',
      endereco_cep: '',
      latitude: '',
      longitude: '',
      prioridade: 0,
      janela_inicio: '',
      janela_fim: '',
      observacoes: '',
      status: 'agendado'
    });
    setTabProdutos([]);
    setTabMontadores([]);
    setEditingId(null);
    setShowModal(true);
  }, []);

  // Geocodificar endereço
  const geocodeAddress = useCallback(async (address) => {
    if (!address || address.trim().length < 5) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(lat).toFixed(6),
          longitude: parseFloat(lon).toFixed(6)
        }));
      }
    } catch (err) {
      console.error('Erro ao geocodificar endereço:', err);
    }
  }, []);

  const buildEnderecoExecucao = useCallback((data) => {
    const parts = [
      data.endereco_rua,
      data.endereco_numero,
      data.endereco_bairro,
      data.endereco_cidade,
      data.endereco_estado,
      data.endereco_cep
    ].filter(Boolean);

    return parts.join(', ');
  }, []);

  const handleEnderecoBlur = useCallback((field, value) => {
    geocodeAddress(buildEnderecoExecucao({
      ...formData,
      [field]: value
    }));
  }, [buildEnderecoExecucao, formData, geocodeAddress]);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
          const dataToSend = {
            data_servico: formData.data_servico,
            tipo_cliente: formData.tipo_cliente,
            loja_id: formData.tipo_cliente === 'loja' ? formData.loja_id || null : null,
            cliente_particular_id: formData.tipo_cliente === 'particular' ? formData.cliente_particular_id || null : null,
            endereco_execucao: buildEnderecoExecucao(formData),
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
            prioridade: formData.prioridade || 0,
            janela_inicio: formData.janela_inicio || null,
            janela_fim: formData.janela_fim || null,
            observacoes: formData.observacoes || null,
            status: formData.status
          };

      if (editingId) {
        await api.put(`/servicos/${editingId}`, dataToSend);
      } else {
        await api.post('/servicos', dataToSend);
      }

      setShowModal(false);
      refetchServicos();
    } catch (err) {
      alert('Erro ao salvar serviço: ' + err.message);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!isAdmin) return;
    try {
      await api.delete(`/servicos/${showDeleteConfirm}`);
      setShowDeleteConfirm(null);
      refetchServicos();
    } catch (err) {
      alert('Erro ao deletar: ' + err.message);
    }
  };

  // Add produto
  const handleAddProduto = () => {
    setTabProdutos([...tabProdutos, { produto_id: '', quantidade: 1, valor_unitario: 0 }]);
  };

  // Remove produto
  const handleRemoveProduto = (idx) => {
    setTabProdutos(tabProdutos.filter((_, i) => i !== idx));
  };

  // Update produto
  const handleUpdateProduto = (idx, field, value) => {
    const updated = [...tabProdutos];
    updated[idx][field] = value;
    if (field === 'produto_id') {
      const prod = produtosById[value];
      if (prod) {
        updated[idx].valor_unitario = prod.valor_base || 0;
      }
    }
    setTabProdutos(updated);
  };

  // Add montador
  const handleAddMontador = () => {
    setTabMontadores([...tabMontadores, { usuario_id: '', valor_atribuido: 0, papel: 'principal' }]);
  };

  // Remove montador
  const handleRemoveMontador = (idx) => {
    setTabMontadores(tabMontadores.filter((_, i) => i !== idx));
  };

  // Update montador
  const handleUpdateMontador = (idx, field, value) => {
    const updated = [...tabMontadores];
    updated[idx][field] = value;
    setTabMontadores(updated);
  };

  const loading = servicosLoading || lojasLoading || particularLoading || usuariosLoading || 
                  produtosLoading || servicoProdutosLoading || servicoMontadoresLoading;

  if (loading) return <div className="servicos-container"><p>Carregando...</p></div>;

  return (
    <div className="servicos">
      {/* Header */}
      <div className="servicos__header">
        <div>
          <h1 className="servicos__title">Serviços</h1>
          <p className="servicos__subtitle">Gerencie todos os agendamentos</p>
        </div>
        <div className="servicos__actions">
          {isAdmin && (
            <button onClick={handleNew} className="servicos__button">
              <MdAdd /> Novo Serviço
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="servicos__stats">
        <StatCard title="Total" value={stats.total} icon="📊" />
        <StatCard title="Agendado" value={stats.agendado} icon="📅" color="#3498db" />
        <StatCard title="Em Rota" value={stats.em_rota} icon="🚚" color="#f39c12" />
        <StatCard title="Concluído" value={stats.concluido} icon="✅" color="#27ae60" />
        <StatCard title="Cancelado" value={stats.cancelado} icon="❌" color="#e74c3c" />
      </div>

      {/* Card Principal */}
      <Card title="Gerenciamento de Serviços">
        {/* Toolbar */}
        <div className="servicos__toolbar">
          <div className="servicos__search">
            <MdSearch className="servicos__search-icon" />
            <input
              type="text"
              placeholder="Buscar por endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="servicos__search-input"
            />
          </div>
          <select
            className="servicos__filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos os status</option>
            <option value="agendado">Agendado</option>
            <option value="em_rota">Em Rota</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select
            className="servicos__filter-select"
            value={clienteFilter}
            onChange={(e) => setClienteFilter(e.target.value)}
          >
            <option value="todos">Todos os clientes</option>
            <option value="loja">Lojas</option>
            <option value="particular">Particulares</option>
          </select>
        </div>

        {filteredServicos.length === 0 ? (
          <div className="servicos__empty-state">
            <div className="servicos__empty-icon">📄</div>
            <h3>Nenhum serviço encontrado</h3>
            <p>Comece adicionando um novo serviço</p>
          </div>
        ) : (
          <div className="servicos__table-wrapper">
            <table className="servicos__table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Endereço</th>
                  <th>Produtos</th>
                  <th>Montadores</th>
                  <th>Janela</th>
                  <th>Prioridade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredServicos.map(servico => {
                  const clienteInfo = getClienteInfo(servico);
                  const prods = getServicoProdutos(servico.id);
                  const mts = getServicoMontadores(servico.id);
                  return (
                    <tr key={servico.id}>
                      <td>{new Date(servico.data_servico).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <strong>{clienteInfo.nome}</strong>
                        <div className="servicos__small-text">{clienteInfo.cpf_cnpj}</div>
                      </td>
                      <td><span className="servicos__badge">{servico.tipo_cliente}</span></td>
                      <td className="servicos__endereco-cell">{servico.endereco_execucao}</td>
                      <td className="servicos__text-center">
                        <span className="servicos__count-badge">{prods.length}</span>
                      </td>
                      <td className="servicos__text-center">
                        <span className="servicos__count-badge">{mts.length}</span>
                      </td>
                      <td className="servicos__small-text">
                        {servico.janela_inicio || '-'}
                        {servico.janela_fim && ` até ${servico.janela_fim}`}
                      </td>
                      <td className="servicos__text-center">
                        <span className={`servicos__priority-${servico.prioridade}`}>
                          {servico.prioridade}
                        </span>
                      </td>
                      <td className="servicos__actions-cell">
                        {isAdmin && (
                          <>
                            <button
                              className="servicos__action-btn servicos__action-btn--edit"
                              onClick={() => handleEdit(servico)}
                              title="Editar"
                            >
                              <MdEdit />
                            </button>
                            <button
                              className="servicos__action-btn servicos__action-btn--delete"
                              onClick={() => setShowDeleteConfirm(servico.id)}
                              title="Deletar"
                            >
                              <MdDelete />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="servicos__modal-overlay" onClick={() => setShowModal(false)}>
          <div className="servicos__modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="servicos__modal-header">
              <h2>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button
                className="servicos__close-btn"
                onClick={() => setShowModal(false)}
                type="button"
                aria-label="Fechar"
              >
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="servicos__modal-form">
              {/* 1. Data + Horário */}
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="data_servico">Data do Serviço *</label>
                  <input
                    id="data_servico"
                    type="date"
                    value={formData.data_servico}
                    onChange={(e) => setFormData({ ...formData, data_servico: e.target.value })}
                    required
                  />
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="janela_inicio">Horário (Início) *</label>
                  <input
                    id="janela_inicio"
                    type="time"
                    value={formData.janela_inicio}
                    onChange={(e) => setFormData({ ...formData, janela_inicio: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 2. Tipo de Cliente + Cliente */}
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="tipo_cliente">Tipo de Cliente *</label>
                  <select
                    id="tipo_cliente"
                    value={formData.tipo_cliente}
                    onChange={(e) => setFormData({ ...formData, tipo_cliente: e.target.value })}
                    required
                  >
                    <option value="loja">Loja</option>
                    <option value="particular">Particular</option>
                  </select>
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="cliente_select">
                    {formData.tipo_cliente === 'loja' ? 'Loja *' : 'Cliente Particular *'}
                  </label>
                  <select
                    id="cliente_select"
                    value={formData.tipo_cliente === 'loja' ? formData.loja_id : formData.cliente_particular_id}
                    onChange={(e) => {
                      if (formData.tipo_cliente === 'loja') {
                        setFormData({ ...formData, loja_id: e.target.value });
                      } else {
                        setFormData({ ...formData, cliente_particular_id: e.target.value });
                      }
                    }}
                    required
                  >
                    <option value="">Selecionar...</option>
                    {formData.tipo_cliente === 'loja'
                      ? lojas?.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.nome || l.nome_fantasia || l.razao_social}
                          </option>
                        ))
                      : particular?.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              {/* 3. Endereço */}
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="endereco_rua">Rua *</label>
                  <input
                    id="endereco_rua"
                    type="text"
                    value={formData.endereco_rua}
                    onChange={(e) => setFormData({ ...formData, endereco_rua: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_rua', e.target.value)}
                    required
                  />
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="endereco_numero">Número *</label>
                  <input
                    id="endereco_numero"
                    type="text"
                    value={formData.endereco_numero}
                    onChange={(e) => setFormData({ ...formData, endereco_numero: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_numero', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="endereco_bairro">Bairro *</label>
                  <input
                    id="endereco_bairro"
                    type="text"
                    value={formData.endereco_bairro}
                    onChange={(e) => setFormData({ ...formData, endereco_bairro: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_bairro', e.target.value)}
                    required
                  />
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="endereco_cidade">Cidade *</label>
                  <input
                    id="endereco_cidade"
                    type="text"
                    value={formData.endereco_cidade}
                    onChange={(e) => setFormData({ ...formData, endereco_cidade: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_cidade', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="endereco_estado">Estado *</label>
                  <input
                    id="endereco_estado"
                    type="text"
                    value={formData.endereco_estado}
                    onChange={(e) => setFormData({ ...formData, endereco_estado: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_estado', e.target.value)}
                    required
                  />
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="endereco_cep">CEP *</label>
                  <input
                    id="endereco_cep"
                    type="text"
                    value={formData.endereco_cep}
                    onChange={(e) => setFormData({ ...formData, endereco_cep: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_cep', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 4. Atribuição + Montador */}
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="atribuicao">Atribuição</label>
                  <input
                    id="atribuicao"
                    type="text"
                    value="Montador Individual"
                    disabled
                    readOnly
                  />
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="montador_select">Montador</label>
                  <select
                    id="montador_select"
                    value={tabMontadores[0]?.usuario_id || ''}
                    onChange={(e) => {
                      if (tabMontadores.length === 0) {
                        setTabMontadores([{ usuario_id: e.target.value, valor_atribuido: 0, papel: 'principal' }]);
                      } else {
                        const updated = [...tabMontadores];
                        updated[0].usuario_id = e.target.value;
                        setTabMontadores(updated);
                      }
                    }}
                  >
                    <option value="">Selecionar...</option>
                    {usuarios
                      ?.filter(u => u.tipo === 'montador')
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* 5. Status */}
              <div className="servicos__form-group servicos__form-group--full">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="agendado">Agendado</option>
                  <option value="em_rota">Em Rota</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* 6. Seção Produtos com Tabela */}
              <div className="servicos__form-section">
                <h3 className="servicos__section-title">Produtos</h3>
                
                {(formData.tipo_cliente === 'particular' || formData.loja_id) && (
                  <>
                    <div className="servicos__filter-row">
                      <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchProduto}
                        onChange={(e) => setSearchProduto(e.target.value)}
                        className="servicos__filter-input"
                      />
                      {categoriasLoja.length > 0 && (
                        <select
                          value={categoriaProduto}
                          onChange={(e) => setCategoriaProduto(e.target.value)}
                          className="servicos__filter-select"
                        >
                          <option value="">Todas as categorias</option>
                          {categoriasLoja.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {tabProdutos.length > 0 ? (
                      <div className="servicos__produtos-table-wrapper">
                        <table className="servicos__produtos-table">
                          <thead>
                            <tr>
                              <th>Produto</th>
                              <th>Qtd</th>
                              <th>Valor Unitário</th>
                              <th>Total</th>
                              <th>Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tabProdutos.map((produto, idx) => (
                              <tr key={idx}>
                                <td>
                                  <select
                                    value={produto.produto_id}
                                    onChange={(e) => handleUpdateProduto(idx, 'produto_id', e.target.value)}
                                    required
                                    className="servicos__produto-select"
                                  >
                                    <option value="">Selecionar...</option>
                                    {produtosFilterados?.map(p => (
                                      <option key={p.id} value={p.id}>
                                        {p.nome} {p.categoria ? `(${p.categoria})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min="1"
                                    value={produto.quantidade}
                                    onChange={(e) => handleUpdateProduto(idx, 'quantidade', Number(e.target.value))}
                                    className="servicos__produto-qty"
                                  />
                                </td>
                                <td>
                                  <span className="servicos__produto-valor">
                                    R$ {produto.valor_unitario.toFixed(2)}
                                  </span>
                                </td>
                                <td>
                                  <span className="servicos__produto-total">
                                    R$ {(produto.quantidade * produto.valor_unitario).toFixed(2)}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="servicos__remove-btn"
                                    onClick={() => handleRemoveProduto(idx)}
                                    aria-label="Remover produto"
                                  >
                                    <MdDelete size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="servicos__no-items">Nenhum produto adicionado.</p>
                    )}

                    <button
                      type="button"
                      className="servicos__btn-add-item"
                      onClick={handleAddProduto}
                    >
                      <MdAdd size={18} /> Adicionar Produto
                    </button>
                  </>
                )}

                {formData.tipo_cliente === 'loja' && !formData.loja_id && (
                  <p className="servicos__no-items">Selecione uma loja para adicionar produtos.</p>
                )}

                {formData.tipo_cliente === '' && (
                  <p className="servicos__no-items">Selecione o tipo de cliente (Loja ou Particular).</p>
                )}
              </div>

              {/* 7. Observações */}
              <div className="servicos__form-group servicos__form-group--full">
                <label htmlFor="observacoes">Observações</label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  placeholder="Adicione observações sobre o serviço..."
                />
              </div>

              {/* 8. Total + Botões */}
              <div className="servicos__form-footer">
                <div className="servicos__total">
                  <span className="servicos__total-label">Total (R$):</span>
                  <span className="servicos__total-value">
                    {tabProdutos.reduce((acc, p) => acc + (p.quantidade * p.valor_unitario), 0).toFixed(2)}
                  </span>
                </div>

                <div className="servicos__form-actions">
                  <button
                    type="button"
                    className="servicos__btn servicos__btn--secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="servicos__btn servicos__btn--primary"
                  >
                    {editingId ? 'Atualizar Serviço' : 'Criar Serviço'}
                  </button>
                </div>
              </div>

              {/* Campos ocultos */}
              <input type="hidden" name="janela_fim" value={formData.janela_fim} />
              <input type="hidden" name="prioridade" value={formData.prioridade} />
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="servicos__modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="servicos__modal-content servicos__modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="servicos__modal-header">
              <h3>Confirmar Exclusão</h3>
            </div>
            <p>Tem certeza que deseja deletar este serviço?</p>
            <div className="servicos__modal-footer">
              <button
                className="servicos__btn servicos__btn--secondary"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancelar
              </button>
              <button
                className="servicos__btn servicos__btn--danger"
                onClick={handleDelete}
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Servicos;
