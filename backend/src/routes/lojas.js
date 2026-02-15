const express = require('express');
const { models } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * GET /lojas
 * Listar todas as lojas
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit, offset, orderBy, orderDir, ...filters } = req.query;
    const options = { where: filters };

    if (limit) {
      options.limit = Math.min(Number(limit), 200);
    }
    if (offset) {
      options.offset = Number(offset);
    }
    if (orderBy) {
      options.order = [[orderBy, orderDir && orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']];
    }

    const results = await models.Loja.findAll(options);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /lojas/:id
 * Buscar loja por ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await models.Loja.findByPk(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /lojas
 * Criar nova loja
 */
router.post('/', async (req, res, next) => {
  try {
    const created = await models.Loja.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /lojas/:id
 * Atualizar loja
 * 
 * Nota: Quando usa_porcentagem ou porcentagem_repasse é alterado,
 * o hook afterUpdate do modelo Loja recalcula automaticamente
 * todos os serviços e montadores.
 */
router.put('/:id', async (req, res, next) => {
  try {
    const lojaAntes = await models.Loja.findByPk(req.params.id);
    if (!lojaAntes) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Atualizar loja (hooks cuidam do recálculo automático)
    const lojaAtualizada = await lojaAntes.update(req.body);

    res.json(lojaAtualizada);
  } catch (err) {
    console.error('Erro ao atualizar loja:', err);
    next(err);
  }
});

/**
 * DELETE /lojas/:id
 * Deletar loja
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await models.Loja.findByPk(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    await existing.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
