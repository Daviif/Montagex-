const express = require('express');
const createCrudRouter = require('./crudRouter');
const { models } = require('../models');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const routeMap = {
  usuarios: models.Usuario,
  equipes: models.Equipe,
  equipe_membros: models.EquipeMembro,
  lojas: models.Loja,
  clientes_particulares: models.ClienteParticular,
  produtos: models.Produto,
  servicos: models.Servico,
  servico_produtos: models.ServicoProduto,
  rotas: models.Rota,
  rota_servicos: models.RotaServico,
  recebimentos: models.Recebimento,
  pagamentos_funcionarios: models.PagamentoFuncionario,
  despesas: models.Despesa
};

Object.entries(routeMap).forEach(([path, model]) => {
  router.use(`/${path}`, createCrudRouter(model));
});

module.exports = router;
