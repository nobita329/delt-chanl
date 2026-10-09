const express = require('express');
const router = express.Router();
const guildController = require('../controllers/guildController');
const { requireAuth } = require('../middleware/auth');
const { requireGuildPermission } = require('../middleware/guildPerms');

router.get('/', requireAuth, guildController.listGuilds);
router.get('/:guildId', requireAuth, requireGuildPermission, guildController.getOverview);

module.exports = router;

