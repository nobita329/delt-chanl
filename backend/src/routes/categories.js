const express = require('express');
const router = express.Router({ mergeParams: true });
const categoryController = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/auth');
const { requireGuildPermission } = require('../middleware/guildPerms');

// All routes here are mounted under /api/guilds/:guildId/categories
router.use(requireAuth, requireGuildPermission);

router.get('/', categoryController.list);
router.post('/', categoryController.create);
router.patch('/:categoryId', categoryController.edit);
router.delete('/:categoryId', categoryController.delete);
router.post('/:categoryId/move', categoryController.move);

module.exports = router;

