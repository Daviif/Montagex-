import React, { useState, useEffect } from 'react'
import { 
  MdTrendingUp, 
  MdTrendingDown, 
  MdShowChart,
  MdAccessTime,
  MdCheckCircle,
  MdCalendarToday,
  MdTrendingFlat,
  MdPeople
} from 'react-icons/md'
import StatCard from '../../components/StatCard/StatCard'
import Card from '../../components/Card/Card'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/dashboard')
      if (response.data?.data) {
        setDashboardData(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading || !dashboardData) {
    return <div className="loading">Carregando...</div>
  }

  // Dados para gráfico de receitas
  const receitasData = dashboardData.graficos?.receitas_por_tipo || []

  // Dados para gráfico de despesas
  const despesasData = dashboardData.graficos?.despesas_mensais || []

  const periodoLabel = dashboardData.periodo?.mes
    ? `${dashboardData.periodo.mes} de ${dashboardData.periodo.ano}`
    : new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())

  const COLORS = ['#FF6B35', '#3498DB', '#27AE60', '#F39C12']

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Visão geral de {periodoLabel}</p>
        </div>
      </div>

      {/* Cards Financeiros Principais */}
      <div className="dashboard-grid-4">
        <StatCard
          title="Total Recebido"
          value={formatCurrency(dashboardData.financeiro.total_recebido)}
          icon={MdTrendingUp}
          iconBg="#27AE60"
          change={`↑ ${dashboardData.financeiro.variacao_mes}% vs mês anterior`}
          changeType="positive"
        />
        
        <StatCard
          title="Total Despesas"
          value={formatCurrency(dashboardData.financeiro.total_despesas)}
          icon={MdTrendingDown}
          iconBg="#E74C3C"
        />
        
        <StatCard
          title="Lucro Operacional"
          value={formatCurrency(dashboardData.financeiro.lucro)}
          icon={MdShowChart}
          iconBg="#3498DB"
          subtitle={`Margem: ${dashboardData.financeiro.margem_lucro}%`}
        />
        
        <StatCard
          title="Pendente"
          value={formatCurrency(dashboardData.financeiro.pendente)}
          icon={MdAccessTime}
          iconBg="#F39C12"
        />
      </div>

      {/* Cards de Serviços */}
      <div className="dashboard-grid-4">
        <StatCard
          title="Serviços Realizados"
          value={dashboardData.servicos.realizados}
          icon={MdCheckCircle}
          iconBg="#27AE60"
        />
        
        <StatCard
          title="Serviços Agendados"
          value={dashboardData.servicos.agendados}
          icon={MdCalendarToday}
          iconBg="#3498DB"
        />
        
        <StatCard
          title="Taxa de Conclusão"
          value={`${dashboardData.servicos.taxa_conclusao}%`}
          icon={MdTrendingFlat}
          iconBg="#9B59B6"
        />
        
        <StatCard
          title="Montadores Ativos"
          value={dashboardData.equipe.montadores_ativos}
          icon={MdPeople}
          iconBg="#FF6B35"
          subtitle={`de ${dashboardData.equipe.total_montadores} cadastrados`}
        />
      </div>

      {/* Gráficos */}
      <div className="dashboard-grid-2">
        <Card
          title="Receitas por Tipo de Cliente"
          subtitle="Distribuição mensal"
        >
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={receitasData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {receitasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: COLORS[0] }}></span>
              <span>Lojas</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: COLORS[1] }}></span>
              <span>Particulares</span>
            </div>
          </div>
        </Card>

        <Card
          title="Despesas por Categoria"
          subtitle="Distribuição mensal"
        >
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={despesasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="despesas" fill="#E74C3C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Nota sobre Windows Desktop */}
      <div className="windows-note">
        <p className="windows-note-title">Ativar o Windows</p>
        <p className="windows-note-text">
          Acesse as configurações do computador para ativar o Windows.
        </p>
      </div>
    </div>
  )
}

export default Dashboard
