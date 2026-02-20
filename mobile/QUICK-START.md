# 🚀 Guia Rápido - Montagex Mobile

## Começando em 3 passos

### 1. Instalar dependências

```bash
cd mobile
npm install
```

### 2. Configurar API

Edite `app.json` e coloque o IP da sua máquina:

```json
"extra": {
  "apiUrl": "http://SEU_IP:3000/api"
}
```

> 💡 Para encontrar seu IP, use `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)

### 3. Executar

```bash
npm start
```

Escaneie o QR code com:
- **Android:** App Expo Go
- **iOS:** Câmera do iPhone

## ⚙️ Comandos Úteis

```bash
# Iniciar
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web

# Limpar cache
expo start -c
```

## 📱 Testando

**Credenciais de teste (use as mesmas do backend):**
- Email: admin@montagex.com
- Senha: admin123

## 🔥 Dicas

1. **Backend deve estar rodando** na porta 3000
2. **Mesmo Wi-Fi** - Celular e computador na mesma rede
3. **Firewall** - Pode precisar liberar a porta 3000
4. **Problemas?** Execute `expo start --tunnel`

## 📂 Estrutura Simples

```
src/
├── screens/       # Telas do app
├── components/    # Componentes reutilizáveis
├── contexts/      # Estados globais
├── services/      # API e WebSocket
└── navigation/    # Navegação
```

## 🎨 Recursos

- ✅ Login e autenticação
- ✅ Dashboard com estatísticas
- ✅ Lista de serviços
- ✅ Detalhes de serviço
- ✅ Perfil do usuário
- ✅ Tema claro/escuro
- ✅ WebSocket em tempo real

## 🐛 Problemas Comuns

**Erro de conexão:** Use IP, não `localhost`
**QR não funciona:** Tente `expo start --tunnel`
**App não atualiza:** Pressione `r` no terminal para reload

## 📖 Mais Informações

Veja o [README.md](README.md) completo para detalhes.
