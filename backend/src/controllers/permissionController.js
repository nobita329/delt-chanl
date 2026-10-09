const discordService = require('../services/discordService');

class PermissionController {
  /**
   * List all roles in the guild
   */
  async getRoles(req, res) {
    try {
      const roles = await discordService.getRoles(req.guildId);
      return res.json({ roles });
    } catch (err) {
      console.error('[PermissionController getRoles Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get permission overwrites for a channel
   */
  async getChannelPermissions(req, res) {
    try {
      const { channelId } = req.params;
      const overwrites = await discordService.getChannelPermissions(req.guildId, channelId);
      return res.json({ overwrites });
    } catch (err) {
      console.error('[PermissionController getChannelPermissions Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Set permission overwrites for a role or member on a channel
   */
  async setChannelPermission(req, res) {
    try {
      const { channelId } = req.params;
      const { targetId, allow, deny } = req.body;

      if (!targetId) {
        return res.status(400).json({ error: 'targetId (role ID or member ID) is required' });
      }

      const result = await discordService.setChannelPermission(
        req.guildId,
        channelId,
        targetId,
        { allow: allow || [], deny: deny || [] },
        req.user
      );

      return res.json(result);
    } catch (err) {
      console.error('[PermissionController setChannelPermission Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new PermissionController();

