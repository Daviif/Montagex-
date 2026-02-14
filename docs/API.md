# 📚 Documentação da API - Sistema de Montagem

## Base URL
```
http://localhost:3001/api/v1
```

## Autenticação

A API usa JWT (JSON Web Tokens). Após login, inclua o token no header:

```
Authorization: Bearer <seu_token_jwt>
```

---

## 🔐 Autenticação

### POST /auth/login
Login do usuário

**Request:**
```json
{
  "email": "usuario@email.com",
  "senha": "sua_senha"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "usuario": {
      "id": "uuid",
      "nome": "Nome do Usuário",
      "email": "usuario@email.com",
      "tipo_usuario": "admin"
    }
  }
}
```

### POST /auth/refresh
Renovar token expirado

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 📊 Dashboard

### GET /dashboard
Resumo geral do negócio

**Response:**
```json
{
  "success": true,
  "data": {
    "periodo": "mes_atual",
    "data_atualizacao": "2024-02-13T10:30:00Z",
    "financeiro": {
      "total_recebido": 45250.00,
      "total_pago": 28100.00,
      "lucro": 17150.00,
      "margem_lucro": 37.9,
      "valores_pendentes": 12300.00
    },
    "servicos": {
      "total_realizados": 87,
      "total_agendados": 23,
      "taxa_conclusao": 94.6
    },
    "equipe": {
      "total_montadores": 6,
      "montadores_ativos_hoje": 4
    }
  }
}
```

### GET /dashboard/financeiro
Resumo financeiro detalhado

**Query Params:**
- `data_inicio` (opcional): Data inicial (YYYY-MM-DD)
- `data_fim` (opcional): Data final (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "inicio": "2024-02-01",
      "fim": "2024-02-29"
    },
    "receitas": {
      "servicos_lojas": 38500.00,
      "servicos_particulares": 6750.00,
      "total": 45250.00,
      "por_forma_pagamento": [...]
    },
    "despesas": {
      "pagamento_equipe": 19600.00,
      "combustivel": 4850.00,
      "total": 28100.00
    },
    "contas_receber": [...],
    "contas_pagar": [...]
  }
}
```

### GET /dashboard/servicos
Estatísticas de serviços

### GET /dashboard/montadores
Performance da equipe

### GET /dashboard/lojas
Análise por loja parceira

### GET /dashboard/graficos
Dados para gráficos

---

## 🛠️ Serviços

### GET /servicos
Listar serviços

**Query Params:**
- `status`: agendado, em_andamento, concluido, cancelado
- `tipo_cliente`: loja, particular
- `data_inicio`: Filtrar por data
- `data_fim`: Filtrar por data
- `montador_id`: Filtrar por montador
- `loja_id`: Filtrar por loja
- `page`: Página (default: 1)
- `limit`: Itens por página (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "servicos": [
      {
        "id": "uuid",
        "codigo_servico": "SRV-2024-001",
        "data_servico": "2024-02-13",
        "tipo_cliente": "loja",
        "cliente_nome": "Móveis Alfa",
        "endereco_completo": "Rua X, 123",
        "valor_final": 850.00,
        "status": "concluido",
        "montadores": ["Carlos Silva", "João Santos"]
      }
    ],
    "pagination": {
      "total": 87,
      "page": 1,
      "pages": 5,
      "limit": 20
    }
  }
}
```

### POST /servicos
Criar novo serviço

**Request:**
```json
{
  "data_servico": "2024-02-15",
  "hora_inicio": "09:00",
  "tipo_cliente": "loja",
  "loja_id": "uuid",
  "endereco_completo": "Rua ABC, 456",
  "cidade": "São Paulo",
  "estado": "SP",
  "produtos": [
    {
      "produto_id": "uuid",
      "quantidade": 1,
      "valor_unitario": 500.00
    }
  ],
  "montadores": [
    {
      "usuario_id": "uuid",
      "papel": "principal",
      "percentual_divisao": 70.00
    },
    {
      "usuario_id": "uuid",
      "papel": "auxiliar",
      "percentual_divisao": 30.00
    }
  ],
  "valor_total": 500.00,
  "valor_deslocamento": 50.00,
  "valor_final": 550.00
}
```

### GET /servicos/:id
Obter detalhes de um serviço

### PUT /servicos/:id
Atualizar serviço

### DELETE /servicos/:id
Cancelar serviço

---

## 💰 Transações

### GET /transacoes
Listar transações financeiras

**Query Params:**
- `tipo_transacao`: recebimento, pagamento, despesa
- `status`: pendente, pago, atrasado, cancelado
- `categoria`: servico, combustivel, ferramenta, etc
- `data_inicio`: Data inicial
- `data_fim`: Data final

### POST /transacoes
Criar transação

**Request:**
```json
{
  "tipo_transacao": "recebimento",
  "categoria": "servico",
  "servico_id": "uuid",
  "loja_id": "uuid",
  "valor": 850.00,
  "data_vencimento": "2024-02-20",
  "forma_pagamento": "pix",
  "descricao": "Montagem guarda-roupa - Móveis Alfa",
  "status": "pendente"
}
```

### PUT /transacoes/:id/pagar
Registrar pagamento

**Request:**
```json
{
  "data_pagamento": "2024-02-13",
  "forma_pagamento": "pix",
  "comprovante_url": "https://..."
}
```

---

## 🏪 Lojas

### GET /lojas
Listar lojas parceiras

### POST /lojas
Cadastrar loja

**Request:**
```json
{
  "nome": "Móveis Alfa",
  "razao_social": "Móveis Alfa Ltda",
  "cnpj": "12.345.678/0001-90",
  "telefone": "(11) 98765-4321",
  "email": "contato@movéisalfa.com",
  "endereco": "Rua Principal, 100",
  "cidade": "São Paulo",
  "estado": "SP",
  "forma_pagamento_padrao": "pix",
  "dia_pagamento": 15,
  "ativo": true
}
```

### GET /lojas/:id
Detalhes da loja

### PUT /lojas/:id
Atualizar loja

### DELETE /lojas/:id
Desativar loja

---

## 👤 Clientes Particulares

### GET /clientes
Listar clientes

### POST /clientes
Cadastrar cliente

**Request:**
```json
{
  "nome": "Maria Silva",
  "cpf": "123.456.789-00",
  "telefone": "(11) 91234-5678",
  "email": "maria@email.com",
  "endereco": "Rua XYZ, 789",
  "cidade": "São Paulo",
  "estado": "SP"
}
```

---

## 📦 Produtos

### GET /produtos
Listar produtos

### POST /produtos
Cadastrar produto

**Request:**
```json
{
  "nome": "Guarda-roupa 6 portas",
  "categoria": "quarto",
  "descricao": "Guarda-roupa planejado 6 portas",
  "valor_base": 450.00,
  "tempo_medio_montagem": 180,
  "complexidade": "alta",
  "ativo": true
}
```

---

## 👥 Usuários (Montadores/Equipe)

### GET /usuarios
Listar usuários

### POST /usuarios
Cadastrar usuário

**Request:**
```json
{
  "nome": "Carlos Silva",
  "email": "carlos@email.com",
  "senha": "senha_segura_123",
  "cpf": "123.456.789-00",
  "telefone": "(11) 98765-4321",
  "tipo_usuario": "montador",
  "salario_base": 2000.00,
  "percentual_comissao": 15.00,
  "data_admissao": "2024-01-01"
}
```

---

## 💸 Despesas

### GET /despesas
Listar despesas operacionais

### POST /despesas
Registrar despesa

**Request:**
```json
{
  "data_despesa": "2024-02-13",
  "tipo_despesa": "combustivel",
  "descricao": "Abastecimento posto Shell",
  "valor": 250.00,
  "usuario_id": "uuid",
  "servico_id": "uuid"
}
```

---

## 🗺️ Rotas

### GET /rotas
Listar rotas planejadas

### POST /rotas
Criar rota

**Request:**
```json
{
  "data_rota": "2024-02-14",
  "montador_id": "uuid",
  "sequencia_servicos": ["uuid1", "uuid2", "uuid3"],
  "observacoes": "Rota zona sul"
}
```

---

## 📝 Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `500` - Erro no servidor

---

## 🔄 Padrão de Resposta

### Sucesso:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

### Erro:
```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": [ ... ]
}
```

---

## 🔌 WebSocket Events

### Eventos do Cliente → Servidor:

- `join` - Entrar em sala
- `servico:atualizado` - Notificar atualização
- `transacao:criada` - Nova transação

### Eventos do Servidor → Cliente:

- `servico:atualizado` - Serviço foi atualizado
- `transacao:criada` - Nova transação criada
- `pagamento:realizado` - Pagamento confirmado

**Exemplo de uso:**
```javascript
socket.on('servico:atualizado', (data) => {
  console.log('Serviço atualizado:', data);
  // Atualizar interface
});
```

---

## 📌 Notas Importantes

1. Todos os valores monetários são em BRL (Real Brasileiro)
2. Datas no formato ISO 8601: `YYYY-MM-DD`
3. Horários no formato 24h: `HH:MM`
4. UUIDs são usados como identificadores
5. Rate limit: 100 requisições por 15 minutos

---

**Para mais detalhes, consulte os exemplos de código no repositório.**