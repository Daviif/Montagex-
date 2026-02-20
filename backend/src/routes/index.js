const express = require('express');
const createCrudRouter = require('./crudRouter');
const authMiddleware = require('../middleware/auth');
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const dashboardSalariosRoutes = require('./dashboardSalarios');
const lojasRoutes = require('./lojas');
const servicosRoutes = require('./servicos');
const anexosRoutes = require('./anexos');
const perfilRoutes = require('./perfil');
const {
  requireAdmin,
  authorizeResource,
  filterPagamentosForMontador,
  sanitizePagamentosResponse,
  validatePagamentoOwnership,
  sanitizePagamentoById
} = require('../middleware/permissions');
const { models } = require('../models');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rotas públicas de autenticação
router.use('/auth', authRoutes);

// Middleware de autenticação para todas as outras rotas
router.use(authMiddleware);

// Rotas de dashboard
router.use('/dashboard/salarios', requireAdmin('Apenas administradores podem acessar salários'), dashboardSalariosRoutes);
router.use('/dashboard', dashboardRoutes);

// Perfil do usuário autenticado
router.use('/perfil', perfilRoutes);

// Rota customizada de lojas (com recálculo automático)
router.use('/lojas', authorizeResource('lojas'), lojasRoutes);

// Rota customizada de servicos (com validação de foreign keys)
router.use('/servicos', servicosRoutes);

// Rota de anexos de serviços
router.use('/anexos', anexosRoutes);

const routeMap = {
  usuarios: models.Usuario,
  equipes: models.Equipe,
  equipe_membros: models.EquipeMembro,
  // lojas: models.Loja, // Removido - usa rota customizada acima
  clientes_particulares: models.ClienteParticular,
  produtos: models.Produto,
  // servicos: models.Servico, // Removido - usa rota customizada acima
  servico_produtos: models.ServicoProduto,
  servico_montadores: models.ServicoMontador,
  rotas: models.Rota,
  rota_servicos: models.RotaServico,
  recebimentos: models.Recebimento,
  pagamentos_funcionarios: models.PagamentoFuncionario,
  despesas: models.Despesa,
  configuracoes: models.Configuracao
};

Object.entries(routeMap).forEach(([path, model]) => {
  const resourceMiddleware = authorizeResource(path);

  if (path === 'pagamentos_funcionarios') {
    router.use(
      `/${path}`,
      resourceMiddleware,
      createCrudRouter(model, {
        beforeGetAll: filterPagamentosForMontador,
        afterGetAll: sanitizePagamentosResponse,
        beforeGetById: validatePagamentoOwnership,
        afterGetById: sanitizePagamentoById
      })
    );
    return;
  }

  router.use(`/${path}`, resourceMiddleware, createCrudRouter(model));
});

module.exports = router;
