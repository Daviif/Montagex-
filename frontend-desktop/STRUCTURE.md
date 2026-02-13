# 📂 Estrutura Completa do Frontend Montagex

## 🏗️ Árvore de Arquivos

```
frontend-desktop/
│
├── 📄 index.html                    # Entry point HTML
├── 📄 package.json                  # Dependências e scripts
├── 📄 vite.config.js                # Configuração Vite
├── 📄 .env.example                  # Template de variáveis
├── 📄 .gitignore                    # Git ignore
│
├── 📚 README.md                     # Documentação principal
├── 📚 QUICK-START.md                # Guia de início rápido
├── 📚 DEVELOPMENT.md                # Guia de desenvolvimento
├── 📚 SUMMARY.md                    # Resumo da implementação
│
├── public/
│   └── (Arquivos públicos - ícones, etc)
│
└── src/
    ├── 📄 main.jsx                  # Entry point React
    ├── 📄 App.jsx                   # Roteamento principal
    │
    ├── 📁 components/               # Componentes reutilizáveis
    │   ├── Card/
    │   │   ├── Card.jsx             # Container genérico
    │   │   └── Card.css
    │   ├── Header/
    │   │   ├── Header.jsx           # Barra superior
    │   │   └── Header.css
    │   ├── Layout/
    │   │   ├── Layout.jsx           # Layout principal
    │   │   └── Layout.css
    │   ├── PrivateRoute/
    │   │   └── PrivateRoute.jsx     # Proteção de rotas
    │   ├── Sidebar/
    │   │   ├── Sidebar.jsx          # Menu lateral
    │   │   └── Sidebar.css
    │   └── StatCard/
    │       ├── StatCard.jsx         # Card de estatísticas
    │       └── StatCard.css
    │
    ├── 📁 contexts/                 # Context APIs
    │   ├── AuthContext.jsx          # Autenticação
    │   └── ThemeContext.jsx         # Tema
    │
    ├── 📁 hooks/                    # Custom Hooks
    │   ├── useApi.js                # Requisições HTTP
    │   └── useFormatters.js         # Formatação
    │
    ├── 📁 pages/                    # Páginas da aplicação
    │   ├── Dashboard/
    │   │   ├── Dashboard.jsx        # ✅ Completo
    │   │   └── Dashboard.css
    │   ├── Login/
    │   │   ├── Login.jsx            # ✅ Completo
    │   │   └── Login.css
    │   ├── Servicos/
    │   │   └── Servicos.jsx         # 🚧 Stub
    │   ├── Clientes/
    │   │   └── Clientes.jsx         # 🚧 Stub
    │   ├── Produtos/
    │   │   └── Produtos.jsx         # 🚧 Stub
    │   ├── Equipe/
    │   │   └── Equipe.jsx           # 🚧 Stub
    │   ├── Rotas/
    │   │   └── Rotas.jsx            # 🚧 Stub
    │   ├── Financeiro/
    │   │   └── Financeiro.jsx       # 🚧 Stub
    │   ├── Relatorios/
    │   │   └── Relatorios.jsx       # 🚧 Stub
    │   └── Settings/
    │       └── Settings.jsx         # 🚧 Stub
    │
    ├── 📁 services/
    │   └── api.js                   # Cliente HTTP Axios
    │
    └── 📁 styles/
        └── global.css               # Estilos globais + CSS Variables
```

## 📊 Contagem de Arquivos

```
Componentes:         7 jsx + 6 css
Contextos:           2 jsx
Hooks:               2 js
Páginas:             10 jsx + 2 css
Serviços:            1 js
Estilos:             1 css (global)
Configuração:        3 arquivos
Documentação:        4 markdown files

============================================
TOTAL:               ~35+ arquivos criados
```

## 🎭 Componentes Hierarquia

```
App
├── Router
│   ├── Login Page
│   └── ProtectedRoutes
│       └── Layout
│           ├── Sidebar (Menu lateral)
│           ├── Header (Barra superior)
│           └── Pages
│               ├── Dashboard
│               │   ├── StatCard (4x Financial)
│               │   ├── StatCard (4x Services)
│               │   └── Card (Charts)
│               ├── Servicos
│               ├── Clientes
│               ├── Produtos
│               ├── Equipe
│               ├── Rotas
│               ├── Financeiro
│               ├── Relatorios
│               └── Settings

Providers
├── AuthContext
├── ThemeContext
└── Router
```

## 🔄 Data Flow

```
┌─────────────────────────────────────────────┐
│              App.jsx (Router)               │
└────────────────┬────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼─────┐    ┌────▼──────┐
    │  Login    │    │ Protected  │
    │  Page     │    │   Routes   │
    └───────────┘    └────┬───────┘
                          │
                     ┌────▼──────────┐
                     │   Layout      │
                     │ (Sidebar +    │
                     │  Header)      │
                     └────┬──────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
         ┌────▼─────────┐    ┌──────▼──────┐
         │  Dashboard   │    │ Other Pages  │
         │  (Gráficos)  │    │ (Stubs)      │
         └──────────────┘    └──────────────┘

Context Flow
────────────
AuthContext: Autenticação global
  ├── signIn()
  ├── signOut()
  ├── user
  └── signed

ThemeContext: Tema global
  ├── theme (light/dark)
  └── toggleTheme()
```

## 📥 Fluxo de Autenticação

```
Login Page
    │
    ├─ User entra email + senha
    │
    ├─ handleSubmit()
    │
    ├─ useAuth().signIn(email, senha)
    │
    ├─ api.post('/auth/login')
    │
    ├─ Response com token + usuario
    │
    ├─ Salva em localStorage
    │
    ├─ Atualiza AuthContext
    │
    └─ Redireciona para /dashboard (Navigate)
       │
       └─ Dashboard renderiza com user data
```

## 🔌 Fluxo de API

```
Component
    │
    ├─ useApi hook (ou direto)
    │
    ├─ api.get('/servicos')
    │
    ├─ Interceptor adiciona token
    │   Authorization: Bearer {token}
    │
    ├─ Requisição em http://localhost:3001/api/v1
    │
    ├─ Response com sucesso (200)
    │
    ├─ setData(response.data)
    │
    └─ Component re-renderiza com dados
```

## 🎨 CSS Organization

```
global.css
├── :root (CSS Variables)
│   ├── Cores (primary, secondary, success, etc)
│   ├── Tamanhos de fonte
│   ├── Espaçamentos
│   ├── Bordas e sombras
│   └── Sidebar width
├── Base styles (*, body, #root)
├── Scrollbar customizado
└── Utilitários (.text-primary, .font-bold, etc)

Component.css
├── .component (bloco principal)
├── .component__header (elemento)
├── .component__body (elemento)
├── .component--active (modificador)
├── .component:hover (pseudo-classe)
└── @media (queries responsivas)
```

## 🚀 Fluxo de Inicialização

```
npm run dev
    │
    ├─ Vite inicia dev server (porta 5173)
    │
    ├─ Carrega index.html
    │
    ├─ Executa main.jsx
    │   └─ Renderiza <App />
    │
    ├─ <App /> inicializa:
    │   ├─ AuthProvider (Context)
    │   ├─ ThemeProvider (Context)
    │   ├─ BrowserRouter (Routes)
    │   └─ Verifica localStorage para sessão
    │
    ├─ Se autenticado → Mostra Dashboard
    │   └─ Layout + Sidebar + Header + Conteúdo
    │
    └─ Se não autenticado → Mostra Login
        └─ Formulário de login
```

## 📱 Responsividade Breakpoints

```
Mobile (< 768px)
├── Sidebar esconde/mobile drawer
├── Grid 1 coluna
├── Header compacto
└── Fonte menor

Tablet (768px - 1024px)
├── Sidebar normal
├── Grid 2 colunas
├── Spacing reduzido
└── Fonte normal

Desktop (> 1024px)
├── Sidebar fixo
├── Grid 4 colunas
├── Full spacing
└── Fonte normal
```

## 🔑 Variáveis de Ambiente

```
.env
├── VITE_API_BASE_URL=http://localhost:3001/api/v1
└── VITE_WS_URL=http://localhost:3001
```

## 🧬 State Management (Context + Hooks)

```
AuthContext
├── State: user, loading, signed
├── Methods: signIn(), signOut()
└── Hook: useAuth()

ThemeContext
├── State: theme
├── Methods: toggleTheme()
└── Hook: useTheme()

Custom Hooks
├── useApi() → Requisições HTTP automáticas
├── useCurrency() → Formatar moeda BRL
├── useDate() → Formatar datas
└── useFormatters() → Utilitários de formatação
```

## 📦 Dependências Principais

```
react@18.2.0                    # UI Library
react-dom@18.2.0                # React DOM
react-router-dom@6.20.0         # Roteamento
axios@1.6.2                     # HTTP Client
socket.io-client@4.6.1          # WebSocket
recharts@2.10.3                 # Gráficos
date-fns@3.0.0                  # Data manipulação
react-icons@4.12.0              # Ícones
styled-components@6.1.8         # CSS-in-JS (opcional)

Dev Dependencies
vite@5.0.8                      # Build tool
electron@28.0.0                 # Desktop (opcional)
```

## 🎯 Scripts disponíveis

```bash
npm run dev              # Dev server (5173)
npm run build            # Build para produção
npm run preview          # Preview do build
npm run electron         # Abrir Electron
npm run electron-dev     # Dev + Electron
npm run electron-build   # Build Electron
```

---

## 📝 Próximos Arquivos Esperados

```
Quando implementar funcionalidades:

src/pages/Servicos/
├── Servicos.jsx         (Listagem)
├── ServicoForm.jsx      (Criar/Editar)
├── ServicoDetail.jsx    (Detalhes)
└── Servicos.css

src/components/Table/
├── Table.jsx            (Tabela reutilizável)
└── Table.css

src/components/Form/
├── Form.jsx             (Form reutilizável)
├── FormField.jsx        (Campo reutilizável)
└── Form.css

src/components/Modal/
├── Modal.jsx
└── Modal.css

src/components/Notification/
├── Toast.jsx
└── Toast.css

src/utils/
├── validators.js        (Validações)
├── helpers.js           (Funções auxiliares)
└── constants.js         (Constantes)
```

---

**Estrutura clara, escalável e pronta para crescer! 🚀**
