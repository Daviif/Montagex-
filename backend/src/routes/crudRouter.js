const express = require('express');

function createCrudRouter(model) {
  const router = express.Router();

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

      const results = await model.findAll(options);
      res.json(results);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const result = await model.findByPk(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const created = await model.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const existing = await model.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }
      const updated = await existing.update(req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const existing = await model.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }
      await existing.destroy();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createCrudRouter;
