# 📱 Montagex Mobile

App mobile do sistema de gestão de montagem de móveis Montagex.

## 🚀 Tecnologias

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **React Navigation** - Navegação entre telas
- **Axios** - Cliente HTTP
- **Socket.IO** - WebSocket em tempo real
- **Expo Secure Store** - Armazenamento seguro
- **React Native Paper** - Componentes UI

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app no seu celular (disponível na App Store e Google Play)

## 🔧 Instalação

1. **Instale as dependências:**
```bash
cd mobile
npm install
```

2. **Configure as variáveis de ambiente:**

Edite o arquivo `app.json` e ajuste a URL da API:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://SEU_IP:3000/api"
    }
  }
}
```

> ⚠️ **Importante:** Use o IP local da sua máquina, não `localhost`, pois o celular precisa acessar pela rede.

## 🏃‍♂️ Executando

1. **Inicie o servidor de desenvolvimento:**
```bash
npm start
```

2. **Configure o IP correto:**

Abra o terminal e execute:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Procure pelo **IPv4 Address** (normalmente começa com `192.168.` ou `172.` ou `10.`)

Edite [app.json](app.json) e atualize:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://SEU_IPv4:3000/api"
    }
  }
}
```

3. **Execute no dispositivo:**
   - **Android:** Pressione `a` no terminal ou escaneie o QR code com o Expo Go
   - **iOS:** Pressione `i` no terminal ou escaneie o QR code com a câmera
   - **Web:** Pressione `w` no terminal

## 🌐 Modo de Conexão

Por padrão, o app inicia em **modo offline** para evitar erros de conexão com a API do Expo:
- Metro usa IP local automaticamente (`exp://192.168.x.x:8082`)
- Para usar **tunnel** (conexão via internet): `npm start -- --tunnel`

## ⚠️ Solução de Problemas

### "Metro waiting on exp://127.0.0.1"
- Significa que está em moloto local, não pode acessar do celular
- **Solução:** Certifique-se que celular e computador estão **na mesma rede Wi-Fi**
- Se mesmo assim não conectar, use: `npm start -- --tunnel`

### Backend não conecta
- Verifique que o backend está rodando: `docker-compose up` (na pasta `/backend`)
- Confirme o IPv4 em `app.json` - **não use `localhost`**
- Firewall pode estar bloqueando: libere a porta 3000

## 📱 Recursos Implementados

### ✅ Autenticação
- Login com email e senha
- Armazenamento seguro de token
- Logout

### ✅ Dashboard
- Estatísticas gerais
- Serviços recentes
- Indicadores visuais

### ✅ Serviços
- Listagem de serviços
- Filtros por status
- Busca
- Detalhes do serviço

### ✅ Perfil
- Informações do usuário
- Configurações
- Tema claro/escuro/automático

### 🚧 Em Desenvolvimento
- Novo serviço
- Equipes
- Financeiro
- Notificações push
- Upload de anexos
- Câmera para fotos

## 📂 Estrutura do Projeto

```
mobile/
├── App.js                      # Componente principal
├── app.json                    # Configuração do Expo
├── babel.config.js             # Configuração Babel
├── package.json                # Dependências
├── src/
│   ├── components/            # Componentes reutilizáveis
│   │   ├── StatCard.jsx
│   │   └── ServiceCard.jsx
│   ├── contexts/              # Contextos React
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── navigation/            # Navegação
│   │   └── index.jsx
│   ├── screens/               # Telas
│   │   ├── LoginScreen.jsx
│   │   ├── HomeScreen.jsx
│   │   ├── ServicosScreen.jsx
│   │   ├── ServicoDetalhesScreen.jsx
│   │   ├── NovoServicoScreen.jsx
│   │   ├── EquipesScreen.jsx
│   │   ├── FinanceiroScreen.jsx
│   │   ├── PerfilScreen.jsx
│   │   └── ConfiguracoesScreen.jsx
│   └── services/              # Serviços
│       ├── api.js
│       └── socket.js
└── assets/                     # Imagens e recursos
```

## 🎨 Tema

O app possui suporte a temas claro e escuro, com opção de seguir o tema do sistema automaticamente.

## 🔌 Conexão com Backend

O app se conecta ao backend através de:
- **HTTP:** Para requisições REST
- **WebSocket:** Para atualizações em tempo real

Configure a URL do backend no arquivo `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.100:3000/api"
    }
  }
}
```

## 🧪 Testando

Para testar no dispositivo físico:

1. Certifique-se de que o dispositivo está na mesma rede Wi-Fi
2. Use o IP da máquina onde o backend está rodando
3. Abra o Expo Go e escaneie o QR code

## 📦 Build de Produção

### Android (APK)

```bash
npm run build:android
```

### iOS (apenas em macOS)

```bash
npm run build:ios
```

## 🐛 Solução de Problemas

### Erro de conexão com API

- Verifique se o backend está rodando
- Confirme que está usando o IP correto (não `localhost`)
- Verifique se o firewall não está bloqueando

### QR Code não funciona

- Use o túnel do Expo: `expo start --tunnel`
- Ou digite o IP manualmente no Expo Go

### Erro de dependências

```bash
rm -rf node_modules
npm install
```

## 📄 Licença

Este projeto faz parte do sistema Montagex.

## 👥 Autores

Desenvolvido para o sistema de gestão Montagex.

## 🔄 Próximas Funcionalidades

- [ ] Notificações push
- [ ] Upload de fotos
- [ ] Assinatura digital
- [ ] Modo offline
- [ ] Sincronização automática
- [ ] Geolocalização
- [ ] Relatórios PDF
- [ ] Chat em tempo real
