const express = require('express');
const router = express.Router({ mergeParams: true });
const permissionController = require('../controllers/permissionController');
const { requireAuth } = require('../middleware/auth');
const { requireGuildPermission } = require('../middleware/guildPerms');

router.use(requireAuth, requireGuildPermission);

router.get('/roles', permissionController.getRoles);
router.get('/channels/:channelId', permissionController.getChannelPermissions);
router.post('/channels/:channelId', permissionController.setChannelPermission);

module.exports = router;

