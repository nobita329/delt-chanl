const discordService = require('../services/discordService');

class ChannelController {
  /**
   * List all channels for a guild
   */
  async list(req, res) {
    try {
      const channels = await discordService.getChannels(req.guildId);
      return res.json({ channels });
    } catch (err) {
      console.error('[ChannelController list Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Create a new channel
   */
  async create(req, res) {
    try {
      const { name, type, parentId, topic, slowmode, nsfw, bitrate, userLimit } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Channel name is required' });
      }

      const channel = await discordService.createChannel(
        req.guildId,
        {
          name: name.trim(),
          type,
          parentId,
          topic,
          rateLimitPerUser: slowmode !== undefined ? parseInt(slowmode, 10) : undefined,
          nsfw,
          bitrate: bitrate ? parseInt(bitrate, 10) : undefined,
          userLimit: userLimit ? parseInt(userLimit, 10) : undefined,
        },
        req.user
      );

      return res.status(201).json({
        channel: {
          id: channel.id,
          name: channel.name,
          type: channel.type,
          parentId: channel.parentId,
        },
      });
    } catch (err) {
      console.error('[ChannelController create Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Edit channel settings
   */
  async edit(req, res) {
    try {
      const { channelId } = req.params;
      const { name, topic, parentId, slowmode, nsfw, position, bitrate, userLimit } = req.body;

      const channel = await discordService.editChannel(
        req.guildId,
        channelId,
        {
          name: name ? name.trim() : undefined,
          topic,
          parentId,
          rateLimitPerUser: slowmode !== undefined ? parseInt(slowmode, 10) : undefined,
          nsfw,
          position: position !== undefined ? parseInt(position, 10) : undefined,
          bitrate: bitrate !== undefined ? parseInt(bitrate, 10) : undefined,
          userLimit: userLimit !== undefined ? parseInt(userLimit, 10) : undefined,
        },
        req.user
      );

      return res.json({
        channel: {
          id: channel.id,
          name: channel.name,
          parentId: channel.parentId,
          topic: channel.topic,
        },
      });
    } catch (err) {
      console.error('[ChannelController edit Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Delete channel
   */
  async delete(req, res) {
    try {
      const { channelId } = req.params;
      const result = await discordService.deleteChannel(req.guildId, channelId, req.user);
      return res.json(result);
    } catch (err) {
      console.error('[ChannelController delete Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Clone channel
   */
  async clone(req, res) {
    try {
      const { channelId } = req.params;
      const { name } = req.body;

      const cloned = await discordService.cloneChannel(
        req.guildId,
        channelId,
        name ? name.trim() : undefined,
        req.user
      );

      return res.status(201).json({
        channel: {
          id: cloned.id,
          name: cloned.name,
          type: cloned.type,
          parentId: cloned.parentId,
        },
      });
    } catch (err) {
      console.error('[ChannelController clone Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Move channel position or parent category
   */
  async move(req, res) {
    try {
      const { channelId } = req.params;
      const { position, parentId } = req.body;

      const channel = await discordService.editChannel(
        req.guildId,
        channelId,
        {
          position: position !== undefined ? parseInt(position, 10) : undefined,
          parentId,
        },
        req.user
      );

      return res.json({ success: true, channelId: channel.id, parentId: channel.parentId });
    } catch (err) {
      console.error('[ChannelController move Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Lock channel
   */
  async lock(req, res) {
    try {
      const { channelId } = req.params;
      const { reason } = req.body;

      const result = await discordService.lockChannel(req.guildId, channelId, reason, req.user);
      return res.json(result);
    } catch (err) {
      console.error('[ChannelController lock Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Unlock channel
   */
  async unlock(req, res) {
    try {
      const { channelId } = req.params;
      const result = await discordService.unlockChannel(req.guildId, channelId, req.user);
      return res.json(result);
    } catch (err) {
      console.error('[ChannelController unlock Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ChannelController();

