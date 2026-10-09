const prisma = require('../config/prisma');

class SettingsController {
  /**
   * Get settings for a guild
   */
  async getSettings(req, res) {
    try {
      const { guildId } = req.params;

      const setting = await prisma.guildSetting.findUnique({
        where: { guildId },
      });

      return res.json({
        settings: setting || {
          guildId,
          prefix: '!',
          logChannelId: null,
          managerRoleId: null,
          auditLogEnabled: true,
        },
      });
    } catch (err) {
      console.error('[SettingsController getSettings Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Update guild settings
   */
  async updateSettings(req, res) {
    try {
      const { guildId } = req.params;
      const { prefix, logChannelId, managerRoleId, auditLogEnabled } = req.body;

      const updated = await prisma.guildSetting.upsert({
        where: { guildId },
        update: {
          prefix: prefix !== undefined ? prefix : undefined,
          logChannelId: logChannelId !== undefined ? logChannelId : undefined,
          managerRoleId: managerRoleId !== undefined ? managerRoleId : undefined,
          auditLogEnabled: auditLogEnabled !== undefined ? Boolean(auditLogEnabled) : undefined,
        },
        create: {
          guildId,
          prefix: prefix || '!',
          logChannelId: logChannelId || null,
          managerRoleId: managerRoleId || null,
          auditLogEnabled: auditLogEnabled !== undefined ? Boolean(auditLogEnabled) : true,
        },
      });

      return res.json({ settings: updated });
    } catch (err) {
      console.error('[SettingsController updateSettings Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new SettingsController();

