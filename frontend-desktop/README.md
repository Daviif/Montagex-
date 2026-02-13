# 🖥️ Montagex - Frontend Desktop

Sistema de Gestão de Montagem - Aplicação Desktop desenvolvida com React + Electron

## 📸 Preview

Dashboard com visão geral de fevereiro de 2026, incluindo:
- Cards financeiros (Total Recebido, Despesas, Lucro, Pendente)
- Métricas de serviços (Realizados, Agendados, Taxa de Conclusão)
- Informações da equipe
- Gráficos de receitas e despesas

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca UI
- **React Router DOM 6** - Roteamento
- **Vite** - Build tool e dev server
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos e visualizações
- **React Icons** - Ícones
- **Styled Components** - Estilização
- **Socket.io Client** - WebSocket para atualizações em tempo real
- **Electron** (opcional) - Para aplicação desktop standalone

## 📁 Estrutura do Projeto

```
frontend-desktop/
├── public/
│   └── electron.js           # Configuração Electron
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── Card/
│   │   ├── Header/
│   │   ├── Layout/
│   │   ├── PrivateRoute/
│   │   ├── Sidebar/
│   │   └── StatCard/
│   ├── contexts/             # Context API
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── pages/                # Páginas da aplicação
│   │   ├── Dashboard/
│   │   ├── Login/
│   │   ├── Servicos/
│   │   ├── Clientes/
│   │   ├── Produtos/
│   │   ├── Equipe/
│   │   ├── Rotas/
│   │   ├── Financeiro/
│   │   ├── Relatorios/
│   │   └── Settings/
│   ├── services/             # Serviços e APIs
│   │   └── api.js
│   ├── styles/               # Estilos globais
│   │   └── global.css
│   ├── App.jsx               # Componente raiz
│   └── main.jsx              # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 Design System

### Cores Principais
- **Primary:** #FF6B35 (Laranja)
- **Secondary:** #2C3E50 (Azul escuro)
- **Success:** #27AE60 (Verde)
- **Warning:** #F39C12 (Amarelo)
- **Danger:** #E74C3C (Vermelho)
- **Info:** #3498DB (Azul)

### Tipografia
- Fonte: Inter (Google Fonts)
- Tamanhos: 12px, 14px, 16px, 18px, 20px, 24px, 32px

## 🔧 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
cd frontend-desktop
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_WS_URL=http://localhost:3001
```

## 🚀 Executando o Projeto

### Modo Desenvolvimento (Web)

```bash
npm run dev
```

Acesse: http://localhost:5173

### Modo Desenvolvimento (Electron)

```bash
npm run electron-dev
```

### Build para Produção

**Build Web:**
```bash
npm run build
```

**Build Electron (Desktop):**
```bash
npm run electron-build
```

Os binários serão gerados na pasta `dist/`.

## 🔑 Credenciais de Teste

Para testar a aplicação, use:

- **Email:** admin@montagex.com
- **Senha:** admin123

## 📱 Páginas Implementadas

### ✅ Completas
- **Login** - Autenticação de usuários
- **Dashboard** - Visão geral com métricas e gráficos
- **Layout** - Estrutura com Sidebar e Header

### 🔄 Em Desenvolvimento
- Serviços
- Clientes
- Produtos
- Equipe
- Rotas
- Financeiro
- Relatórios
- Settings

## 🎯 Funcionalidades Principais

### Dashboard
- 📊 Cards de métricas financeiras
  - Total recebido com comparação mensal
  - Total de despesas
  - Lucro operacional com margem
  - Valores pendentes

- 📈 Cards de serviços
  - Serviços realizados
  - Serviços agendados
  - Taxa de conclusão
  - Montadores ativos

- 📉 Gráficos
  - Receitas por tipo de cliente (Pizza)
  - Despesas por categoria (Barras)

### Autenticação
- Login com JWT
- Proteção de rotas
- Refresh token automático
- Logout

### Navegação
- Menu lateral responsivo
- 8 seções principais
- Indicador de página ativa
- Perfil do usuário

## 🔌 Integração com Backend

A aplicação está configurada para se conectar ao backend em:
- **API REST:** http://localhost:3001/api/v1
- **WebSocket:** http://localhost:3001

### Endpoints Utilizados

```javascript
// Autenticação
POST /auth/login

// Dashboard
GET /dashboard

// Futuramente
GET /servicos
GET /clientes
GET /produtos
GET /equipe
GET /rotas
GET /financeiro
```

## 🎨 Componentes Reutilizáveis

### StatCard
Card para exibir métricas com ícone e variação:
```jsx
<StatCard
  title="Total Recebido"
  value="R$ 45.250,00"
  icon={MdTrendingUp}
  iconBg="#27AE60"
  change="↑ 12% vs mês anterior"
  changeType="positive"
/>
```

### Card
Container genérico para conteúdo:
```jsx
<Card title="Título" subtitle="Subtítulo">
  <p>Conteúdo</p>
</Card>
```

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run electron         # Inicia Electron
npm run electron-dev     # Inicia React + Electron

# Build
npm run build            # Build para produção (web)
npm run preview          # Preview do build
npm run electron-build   # Build Electron (desktop)
```

## 🐛 Troubleshooting

### Erro de CORS
Se encontrar erros de CORS, verifique se o backend está rodando e configure corretamente no `backend/src/app.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
```

### Porta já em uso
Se a porta 5173 já estiver em uso, você pode alterar no `vite.config.js`:

```javascript
server: {
  port: 3000 // Sua porta desejada
}
```

### Variáveis de ambiente não carregando
Certifique-se de que o arquivo `.env` está na raiz de `frontend-desktop/` e que as variáveis começam com `VITE_`.

## 📝 Próximos Passos

### Funcionalidades Planejadas
- [ ] Implementar CRUD de Serviços
- [ ] Implementar CRUD de Clientes (Lojas e Particulares)
- [ ] Implementar CRUD de Produtos
- [ ] Implementar Gestão de Equipe
- [ ] Implementar Planejamento de Rotas
- [ ] Implementar Gestão Financeira
- [ ] Implementar Sistema de Relatórios
- [ ] Implementar Configurações e Perfil
- [ ] Adicionar notificações em tempo real (WebSocket)
- [ ] Implementar sistema de salários
- [ ] Adicionar exportação de relatórios (PDF, Excel)
- [ ] Implementar modo escuro
- [ ] Adicionar testes unitários
- [ ] Otimizar performance

### Melhorias de UX
- [ ] Loading skeletons
- [ ] Animações de transição
- [ ] Toast notifications
- [ ] Confirmações de ações
- [ ] Breadcrumbs
- [ ] Drag and drop para rotas
- [ ] Upload de arquivos
- [ ] Preview de imagens

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Crie uma branch para sua feature: `git checkout -b feature/MinhaFeature`
2. Commit suas mudanças: `git commit -m 'Adiciona MinhaFeature'`
3. Push para a branch: `git push origin feature/MinhaFeature`
4. Abra um Pull Request

## 📄 Licença

Este projeto é parte do sistema Montagex.

## 👥 Equipe

- Frontend: React + Vite + Electron
- Backend: Node.js + Express + PostgreSQL
- Mobile: React Native (em desenvolvimento)

## 📞 Suporte

Para questões e suporte, consulte a documentação completa em `/docs/`.

---

**Desenvolvido com ❤️ para o Montagex**
