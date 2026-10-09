const prisma = require('../config/prisma');

class AuditLogController {
  /**
   * Get audit logs for a guild with pagination and filters
   */
  async getAuditLogs(req, res) {
    try {
      const { guildId } = req.params;
      const { page = '1', limit = '20', action, search } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const where = { guildId };

      if (action) {
        where.action = action;
      }

      if (search) {
        where.OR = [
          { targetName: { contains: search } },
          { executorTag: { contains: search } },
          { action: { contains: search } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return res.json({
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      console.error('[AuditLogController getAuditLogs Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AuditLogController();

