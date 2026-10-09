const express = require('express');
const router = express.Router({ mergeParams: true });
const settingsController = require('../controllers/settingsController');
const { requireAuth } = require('../middleware/auth');
const { requireGuildPermission } = require('../middleware/guildPerms');

router.use(requireAuth, requireGuildPermission);

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);

module.exports = router;

