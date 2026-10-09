const express = require('express');
const router = express.Router({ mergeParams: true });
const channelController = require('../controllers/channelController');
const { requireAuth } = require('../middleware/auth');
const { requireGuildPermission } = require('../middleware/guildPerms');

// All routes here are mounted under /api/guilds/:guildId/channels
router.use(requireAuth, requireGuildPermission);

router.get('/', channelController.list);
router.post('/', channelController.create);
router.patch('/:channelId', channelController.edit);
router.delete('/:channelId', channelController.delete);
router.post('/:channelId/clone', channelController.clone);
router.post('/:channelId/move', channelController.move);
router.post('/:channelId/lock', channelController.lock);
router.post('/:channelId/unlock', channelController.unlock);

module.exports = router;

