# 🚀 Guia Rápido - Frontend Desktop Montagex

## Início Rápido (5 minutos)

### 1. Instalar Dependências

```bash
cd frontend-desktop
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env baseado no exemplo
cp .env.example .env
```

**Conteúdo do `.env`:**
```
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_WS_URL=http://localhost:3001
```

### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

A aplicação abrirá automaticamente em: **http://localhost:5173**

## 🔐 Login de Teste

- **Email:** admin@montagex.com
- **Senha:** admin123

## 📊 O Que Você Verá

### Dashboard
- ✅ Cards financeiros: Total Recebido, Despesas, Lucro, Pendente
- ✅ Métricas de serviços: Realizados, Agendados, Taxa de Conclusão
- ✅ Equipe: Montadores ativos
- ✅ Gráficos: Receitas por cliente, Despesas por mês

### Menu Lateral
- Dashboard ✅
- Serviços 🚧
- Clientes 🚧
- Produtos 🚧
- Equipe 🚧
- Rotas 🚧
- Financeiro 🚧
- Relatórios 🚧

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia dev server (porta 5173)

# Build
npm run build            # Build para produção
npm run preview          # Preview do build

# Electron (Desktop)
npm run electron         # Abre Electron
npm run electron-dev     # Dev + Electron juntos
npm run electron-build   # Build Electron para distribuição
```

## 📁 Estrutura de Pastas

```
frontend-desktop/
├── src/
│   ├── components/       # Componentes reutilizáveis (Card, StatCard, etc)
│   ├── contexts/         # Context API (Auth, Theme)
│   ├── pages/            # Páginas da aplicação
│   ├── services/         # Serviços HTTP (api.js)
│   ├── styles/           # CSS global
│   ├── App.jsx           # Roteamento
│   └── main.jsx          # Entry point
├── .env                  # Variáveis de ambiente
├── package.json
└── vite.config.js
```

## 🎨 Design System

**Cores Principais:**
- Laranja: `#FF6B35` (Primary)
- Azul Escuro: `#2C3E50` (Secondary)
- Verde: `#27AE60` (Success)
- Vermelho: `#E74C3C` (Danger)

**Tipografia:**
- Font: Inter (Google Fonts)
- Tamanhos: 12px até 32px

## 🔗 Integração com Backend

A aplicação faz requisições para:

```
Backend: http://localhost:3001/api/v1
```

**Certifique-se de que o backend está rodando:**

```bash
cd backend
npm install
npm run dev
```

## ⚡ Próximas Tarefas

### Curtíssimo Prazo
- [ ] Conectar Dashboard com API real
- [ ] Implementar gráficos dinâmicos
- [ ] Adicionar notificações

### Curto Prazo
- [ ] CRUD de Serviços
- [ ] CRUD de Clientes
- [ ] CRUD de Produtos
- [ ] Gestão de Equipe

### Médio Prazo
- [ ] Rotas e planejamento
- [ ] Dashboard financeiro
- [ ] Sistema de relatórios
- [ ] Configurações do sistema

### Longo Prazo
- [ ] Modo escuro
- [ ] Testes automatizados
- [ ] Performance optimization
- [ ] PWA support

## 🐛 Resolução de Problemas

### Problema: "Porta 5173 já em uso"

**Solução:** Altere a porta em `vite.config.js`:

```javascript
server: {
  port: 3000 // Use 3000 ou outra porta livre
}
```

### Problema: "Erro de CORS"

**Solução:** Verifique se o backend permite requisições de `http://localhost:5173`:

```javascript
// backend/src/app.js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
```

### Problema: "API não encontrada"

**Verificar:**
1. Backend está rodando? (`npm run dev` em `backend/`)
2. URL da API está correta em `.env`?
3. Backend escuta na porta 3001?

## 💡 Dicas Úteis

### Hot Module Replacement (HMR)
Qualquer alteração no código é refletida instantaneamente no navegador!

### Debugging
1. Abra DevTools: `F12` ou `Ctrl+Shift+I`
2. Acesse a aba "Network" para ver requisições
3. Console para verificar erros

### Offline
Para testar modo offline, use dados mockados no Dashboard

## 📚 Documentação

- **Dashboard:** Veja `src/pages/Dashboard/Dashboard.jsx`
- **Componentes:** Veja `src/components/`
- **Contextos:** Veja `src/contexts/`
- **Serviços:** Veja `src/services/api.js`

## 🎯 Estrutura de uma Página Nova

### 1. Criar arquivo em `src/pages/NomePagina/NomePagina.jsx`

```jsx
import React from 'react'
import './NomePagina.css'

const NomePagina = () => {
  return (
    <div>
      <h1>Nome Página</h1>
    </div>
  )
}

export default NomePagina
```

### 2. Importar em `src/App.jsx`

```jsx
import NomePagina from './pages/NomePagina/NomePagina'

// Em <Routes>
<Route path="nome-pagina" element={<NomePagina />} />
```

### 3. Adicionar ao menu em `src/components/Sidebar/Sidebar.jsx`

```jsx
const menuItems = [
  // ... itens existentes
  {
    path: '/nome-pagina',
    icon: MdIcon,
    label: 'Nome Página'
  }
]
```

## 🚀 Deploy

### Netlify/Vercel

```bash
# Build
npm run build

# O conteúdo de `dist/` é pronto para produção
```

### Docker (futuro)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 📞 Contato & Suporte

Dúvidas? Consulte:
- Backend README: `backend/README.md`
- Documentação API: `docs/API.md`
- Documentação de Salários: `docs/SALARIOS-SISTEMA.md`

---

**Pronto para começar? Execute `npm run dev` e aproveite! 🎉**
