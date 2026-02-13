# 🚀 Aplicar Migração do Sistema de Salários

## Passo 1: Aplicar Migração no Banco de Dados

Execute o script SQL de migração:

```bash
psql -U seu_usuario -d nome_do_banco -f database/migrations/001_salarios_sistema.sql
```

Ou se estiver usando Docker:

```bash
docker exec -i seu_container_postgres psql -U seu_usuario -d nome_do_banco < database/migrations/001_salarios_sistema.sql
```

## Passo 2: Reiniciar o Backend

```bash
cd backend
npm restart
```

ou se estiver em desenvolvimento:

```bash
cd backend
npm run dev
```

## Passo 3: Verificar as Mudanças

Teste os novos endpoints:

### 1. Verificar Configurações
```bash
curl http://localhost:3001/api/v1/configuracoes \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 2. Testar Endpoint de Salários
```bash
curl "http://localhost:3001/api/v1/dashboard/salarios?data_inicio=2024-02-01&data_fim=2024-02-29" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 3. Criar um Serviço com Montadores
```bash
curl -X POST http://localhost:3001/api/v1/servicos \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data_servico": "2024-02-15",
    "tipo_cliente": "loja",
    "loja_id": "uuid-da-loja",
    "endereco_execucao": "Rua Teste, 123",
    "valor_total": 1500.00,
    "valor_repasse_montagem": 75.00,
    "status": "agendado"
  }'
```

### 4. Atribuir Montador ao Serviço
```bash
curl -X POST http://localhost:3001/api/v1/servico_montadores \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "servico_id": "uuid-do-servico",
    "usuario_id": "uuid-do-montador",
    "valor_atribuido": 75.00,
    "percentual_divisao": 100.00,
    "papel": "principal"
  }'
```

## Passo 4: Dados de Teste

### Criar Loja com Porcentagem

```sql
INSERT INTO lojas (nome, usa_porcentagem, porcentagem_repasse, observacoes_pagamento)
VALUES 
('Móveis Teste', true, 5.00, 'Pagamento até dia 15 de cada mês');
```

### Atualizar Fórmula de Salário

```sql
UPDATE configuracoes 
SET valor = 'valor_montagem * 1.15'
WHERE chave = 'salario_formula';
```

## ✅ Checklist de Verificação

- [ ] Tabela `configuracoes` foi criada
- [ ] Tabela `servico_montadores` foi criada
- [ ] Campos foram adicionados em `lojas`
- [ ] Campo foi adicionado em `servicos`
- [ ] Backend reiniciado sem erros
- [ ] Endpoint `/api/v1/configuracoes` está funcionando
- [ ] Endpoint `/api/v1/servico_montadores` está funcionando
- [ ] Endpoint `/api/v1/dashboard/salarios` está funcionando
- [ ] Frontend pode criar serviços com montadores
- [ ] Dashboard exibe card de salários

## 🔧 Troubleshooting

### Erro: "relation configuracoes does not exist"
- Execute a migração SQL novamente
- Verifique se está no banco de dados correto

### Erro: "Cannot read properties of undefined"
- Reinicie o backend para carregar os novos modelos
- Verifique se os arquivos de modelo foram criados corretamente

### Erro no cálculo de fórmula
- Verifique a sintaxe da fórmula em `configuracoes`
- Use apenas expressões JavaScript válidas
- Variável disponível: `valor_montagem`

## 📚 Documentação Completa

Para documentação completa, consulte:
- `docs/SALARIOS-SISTEMA.md` - Documentação detalhada do sistema
- `docs/API.md` - Documentação da API
