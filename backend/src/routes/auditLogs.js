const express = require('express');
const router = express.Router({ mergeParams: true });
const auditLogController = require('../controllers/auditLogController');
const { requireAuth } = require('../middleware/auth');
const { requireGuildPermission } = require('../middleware/guildPerms');

router.use(requireAuth, requireGuildPermission);

router.get('/', auditLogController.getAuditLogs);

module.exports = router;

