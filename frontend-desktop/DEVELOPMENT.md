# 📚 Guia de Desenvolvimento - Frontend Montagex

## 🎯 Convenções e Práticas

### Nomenclatura

#### Componentes
```jsx
// ✅ BOM
function UserProfile() { }
export default UserProfile

// ❌ RUIM
function user_profile() { }
function userProfileComponent() { }
```

#### Arquivos e Pastas
```
✅ BOM:
src/components/UserProfile/UserProfile.jsx
src/pages/Dashboard/Dashboard.jsx
src/hooks/useApi.js

❌ RUIM:
src/components/userProfile.jsx
src/pages/dashboard/index.jsx
src/hooks/api.js
```

#### Variáveis e Funções
```javascript
// ✅ BOM
const handleSubmit = (e) => { }
const [isLoading, setIsLoading] = useState(false)
const formatCurrency = (value) => { }

// ❌ RUIM
const submit = (e) => { }
const [load, setLoad] = useState(false)
const currency = (value) => { }
```

### Estrutura de Componente

```jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/Card/Card'
import api from '../../services/api'
import './ComponentName.css'

/**
 * Breve descrição do componente
 * 
 * @param {object} props
 * @param {string} props.title - Título do componente
 * @param {function} props.onSubmit - Callback ao enviar
 * @returns {JSX.Element}
 */
const ComponentName = ({ title, onSubmit }) => {
  // ===== HOOKS DE ESTADO =====
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ===== CONTEXTOS =====
  const { user } = useAuth()

  // ===== EFFECTS =====
  useEffect(() => {
    loadData()
  }, [])

  // ===== FUNÇÕES =====
  const loadData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/endpoint')
      setData(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    // Implementar
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(data)
  }

  // ===== RENDER =====
  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <Card title={title}>
      <form onSubmit={handleSubmit}>
        {/* Conteúdo */}
      </form>
    </Card>
  )
}

export default ComponentName
```

## 🎨 Estilo CSS

### Convenção de Classes

```css
/* ✅ BOM - BEM Methodology */
.component-name { }
.component-name__header { }
.component-name__body { }
.component-name__footer { }
.component-name--active { }
.component-name--disabled { }

/* ❌ RUIM */
.componentName { }
.component_name { }
.component-name-header { }
.active { }
```

### Estrutura CSS

```css
/* 1. Bloco principal */
.card {
  background-color: var(--bg-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
}

/* 2. Elementos do bloco */
.card__header {
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.card__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.card__body {
  padding-top: var(--spacing-md);
}

/* 3. Modificadores */
.card--highlighted {
  border: 2px solid var(--primary-color);
}

.card--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 4. Media queries */
@media (max-width: 768px) {
  .card {
    padding: var(--spacing-md);
  }
}
```

## 🔌 Padrões de Requisições HTTP

### Usando useApi Hook

```jsx
import { useApi } from '../../hooks/useApi'

function MyComponent() {
  // GET automático
  const { data, loading, error, refetch } = useApi('/servicos')

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {error && <p>Erro: {error}</p>}
      {data && <p>{data.length} serviços</p>}
      <button onClick={() => refetch()}>Recarregar</button>
    </div>
  )
}
```

### Usando api.js Diretamente

```jsx
import api from '../../services/api'

async function createServico(data) {
  try {
    const response = await api.post('/servicos', data)
    return response.data
  } catch (error) {
    console.error('Erro:', error.response?.data?.message)
    throw error
  }
}
```

## 📝 Padrão de Formulários

```jsx
import React, { useState } from 'react'
import Card from '../../components/Card/Card'

const FormServico = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    data_servico: '',
    tipo_cliente: 'loja',
    valor_total: '',
    endereco: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.data_servico) newErrors.data_servico = 'Data obrigatória'
    if (!formData.valor_total) newErrors.valor_total = 'Valor obrigatório'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    try {
      setLoading(true)
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Novo Serviço">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="data_servico">Data do Serviço</label>
          <input
            type="date"
            id="data_servico"
            name="data_servico"
            value={formData.data_servico}
            onChange={handleChange}
            className={errors.data_servico ? 'error' : ''}
          />
          {errors.data_servico && (
            <span className="error-message">{errors.data_servico}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="tipo_cliente">Tipo de Cliente</label>
          <select
            id="tipo_cliente"
            name="tipo_cliente"
            value={formData.tipo_cliente}
            onChange={handleChange}
          >
            <option value="loja">Loja</option>
            <option value="particular">Particular</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </Card>
  )
}

export default FormServico
```

## 🎯 Checklist para Nova Página

- [ ] Criar pasta em `src/pages/NomePagina/`
- [ ] Criar arquivo `NomePagina.jsx` com componente
- [ ] Criar arquivo `NomePagina.css` com estilos
- [ ] Importar em `src/App.jsx`
- [ ] Adicionar rota
- [ ] Adicionar ao menu `Sidebar.jsx`
- [ ] Documentar a página com comentários
- [ ] Testar navegação
- [ ] Testar responsividade

## 🧪 Exemplo: Página de Serviços

### 1. Layout Base

```jsx
// src/pages/Servicos/Servicos.jsx
import React, { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import Card from '../../components/Card/Card'
import './Servicos.css'

const Servicos = () => {
  const { data: servicos, loading, error } = useApi('/servicos')
  const [filter, setFilter] = useState('todos')

  const filteredServicos = servicos?.filter(s => {
    if (filter === 'todos') return true
    return s.status === filter
  })

  return (
    <div className="servicos">
      <div className="servicos-header">
        <h1>Serviços</h1>
        <button className="btn-primary">Novo Serviço</button>
      </div>

      <div className="servicos-filters">
        {['todos', 'agendado', 'em_andamento', 'concluido'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        {loading && <p>Carregando...</p>}
        {error && <p>Erro: {error}</p>}
        {filteredServicos && (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredServicos.map(servico => (
                <tr key={servico.id}>
                  <td>{servico.codigo_servico}</td>
                  <td>{servico.cliente_nome}</td>
                  <td>{new Date(servico.data_servico).toLocaleDateString('pt-BR')}</td>
                  <td><span className={`status-${servico.status}`}>{servico.status}</span></td>
                  <td>
                    <button>Editar</button>
                    <button>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

export default Servicos
```

## 🚀 Performance

### Otimizações Recomendadas

1. **Code Splitting**
```jsx
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))

<Suspense fallback={<div>Carregando...</div>}>
  <Dashboard />
</Suspense>
```

2. **Memoização**
```jsx
import { memo } from 'react'

const StatCard = memo(({ title, value }) => {
  return <div>{title}: {value}</div>
})
```

3. **useCallback para Callbacks**
```jsx
const handleClick = useCallback(() => {
  console.log('Clicado')
}, [dependency])
```

## 🔐 Segurança

1. **Sempre usar variáveis de ambiente**
```javascript
const API_URL = import.meta.env.VITE_API_BASE_URL
```

2. **Nunca expor tokens em logs**
```javascript
// ❌ RUIM
console.log('Token:', token)

// ✅ BOM
console.log('Autenticado:', !!token)
```

3. **Validar inputs**
```javascript
if (!email.includes('@')) {
  setError('Email inválido')
  return
}
```

## 📱 Responsividade

Sempre usar breakpoints CSS:

```css
/* Mobile first */
.component { }

/* Tablet */
@media (min-width: 768px) {
  .component { }
}

/* Desktop */
@media (min-width: 1024px) {
  .component { }
}
```

## 🐛 Debugging

### DevTools
- F12 ou Ctrl+Shift+I
- Network tab: Ver requisições
- Console: Ver logs e erros
- React tab: Inspecionar componentes

### Console.log Útil
```javascript
console.log('Data:', data)          // Variável
console.error('Erro:', error)       // Erro
console.table(servicos)             // Tabela
console.time('API')                 // Medir tempo
```

## 📖 Documentação de Componente

```jsx
/**
 * Componente que exibe um card com informações
 * 
 * @component
 * @example
 * <StatCard
 *   title="Receita"
 *   value="R$ 1.250,00"
 *   icon={MdDollar}
 *   change="↑ 12%"
 * />
 * 
 * @param {object} props - Props do componente
 * @param {string} props.title - Título principal
 * @param {string} props.value - Valor exibido
 * @param {React.Component} props.icon - Ícone
 * @param {string} props.change - Variação (opcional)
 * @returns {JSX.Element} O componente renderizado
 */
```

---

**Siga estas convenções para manter o código limpo e consistente! 🎯**
