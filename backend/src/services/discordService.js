const { ChannelType, PermissionFlagsBits } = require('discord.js');
const client = require('../../../bot/src/client');
const prisma = require('../config/prisma');

class DiscordService {
  /**
   * Get discord.js client
   */
  getClient() {
    return client;
  }

  /**
   * Check if bot is in a guild
   * @param {string} guildId
   */
  isBotInGuild(guildId) {
    return client.guilds.cache.has(guildId);
  }

  /**
   * Fetch guild from cache or API
   * @param {string} guildId
   */
  async getGuild(guildId) {
    const cached = client.guilds.cache.get(guildId);
    if (cached) return cached;
    try {
      return await client.guilds.fetch(guildId);
    } catch {
      return null;
    }
  }

  /**
   * Check bot permissions in guild
   * @param {import('discord.js').Guild} guild
   */
  checkBotPermissions(guild) {
    const me = guild.members.me;
    if (!me) return { canManage: false, missing: ['Bot member not found in server'] };

    const required = [
      { name: 'Manage Channels', flag: PermissionFlagsBits.ManageChannels },
      { name: 'View Channel', flag: PermissionFlagsBits.ViewChannel },
      { name: 'Manage Roles', flag: PermissionFlagsBits.ManageRoles },
    ];

    const missing = [];
    for (const req of required) {
      if (!me.permissions.has(req.flag)) {
        missing.push(req.name);
      }
    }

    return {
      canManage: missing.length === 0,
      missing,
      hasAdmin: me.permissions.has(PermissionFlagsBits.Administrator),
    };
  }

  /**
   * Get guild overview metrics
   */
  async getGuildOverview(guildId) {
    const guild = await this.getGuild(guildId);
    if (!guild) return null;

    const channels = guild.channels.cache;
    const categories = channels.filter((c) => c.type === ChannelType.GuildCategory);
    const textChannels = channels.filter((c) => c.type === ChannelType.GuildText);
    const voiceChannels = channels.filter((c) => c.type === ChannelType.GuildVoice);
    const announcementChannels = channels.filter((c) => c.type === ChannelType.GuildAnnouncement);
    const forumChannels = channels.filter((c) => c.type === ChannelType.GuildForum);

    const botPerms = this.checkBotPermissions(guild);

    return {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ dynamic: true, size: 256 }),
      banner: guild.bannerURL({ dynamic: true, size: 512 }),
      memberCount: guild.memberCount,
      ownerId: guild.ownerId,
      botPermissions: botPerms,
      stats: {
        totalChannels: channels.size,
        categoryCount: categories.size,
        textCount: textChannels.size,
        voiceCount: voiceChannels.size,
        announcementCount: announcementChannels.size,
        forumCount: forumChannels.size,
        roleCount: guild.roles.cache.size,
      },
    };
  }

  /**
   * List all categories for a guild with child channel IDs
   */
  async getCategories(guildId) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const categories = guild.channels.cache
      .filter((c) => c.type === ChannelType.GuildCategory)
      .sort((a, b) => a.position - b.position)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        position: cat.position,
        rawPosition: cat.rawPosition,
        channels: cat.children?.cache
          ? cat.children.cache.map((ch) => ({
              id: ch.id,
              name: ch.name,
              type: ch.type,
              typeName: ChannelType[ch.type] || 'Unknown',
              position: ch.position,
            }))
          : [],
        permissionOverwrites: cat.permissionOverwrites?.cache
          ? cat.permissionOverwrites.cache.map((po) => ({
              id: po.id,
              type: po.type, // 0 = Role, 1 = Member
              allow: po.allow?.toArray ? po.allow.toArray() : [],
              deny: po.deny?.toArray ? po.deny.toArray() : [],
            }))
          : [],
      }));

    return categories;
  }

  /**
   * Create category
   */
  async createCategory(guildId, { name, position }, executor) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      position: position !== undefined ? position : undefined,
    });

    await this.logAction({
      guildId,
      action: 'CATEGORY_CREATE',
      targetId: category.id,
      targetName: category.name,
      executorId: executor.id,
      executorTag: executor.tag || executor.username,
      source: 'WEB_PANEL',
      details: { position: category.position },
    });

    return category;
  }

  /**
   * Edit category
   */
  async editCategory(guildId, categoryId, { name, position }, executor) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const category = guild.channels.cache.get(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      throw new Error('Category not found');
    }

    const oldName = category.name;
    const updateData = {};
    if (name) updateData.name = name;
    if (position !== undefined) updateData.position = position;

    await category.edit(updateData);

    await this.logAction({
      guildId,
      action: 'CATEGORY_EDIT',
      targetId: category.id,
      targetName: category.name,
      executorId: executor.id,
      executorTag: executor.tag || executor.username,
      source: 'WEB_PANEL',
      details: { oldName, updateData },
    });

    return category;
  }

  /**
   * Delete category and all child channels
   */
  async deleteCategory(guildId, categoryId, executor, deleteChannels = true) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const category = guild.channels.cache.get(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      throw new Error('Category not found');
    }

    const catName = category.name;
    const deletedChannels = [];

    // Delete all child channels belonging to this category
    if (deleteChannels) {
      const children = Array.from(category.children.cache.values());
      for (const child of children) {
        try {
          const childName = child.name;
          await child.delete(`Deleted with parent category ${catName} by ${executor.username}`);
          deletedChannels.push(childName);
        } catch (err) {
          console.error(`Failed to delete child channel ${child.id}:`, err);
        }
      }
    }

    await category.delete(`Deleted via Web Panel by ${executor.username}`);

    await this.logAction({
      guildId,
      action: 'CATEGORY_DELETE',
      targetId: categoryId,
      targetName: catName,
      executorId: executor.id,
      executorTag: executor.tag || executor.username,
      source: 'WEB_PANEL',
      details: { deletedChannelsCount: deletedChannels.length, deletedChannels },
    });

    return { success: true, id: categoryId, name: catName, deletedChannels };
  }

  /**
   * List all channels in guild
   */
  async getChannels(guildId) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const channels = guild.channels.cache
      .filter((c) => c.type !== ChannelType.GuildCategory)
      .map((c) => {
        // Check if locked
        let isLocked = false;
        const everyoneId = guild.roles?.everyone?.id || guild.id;
        const everyoneOverwrites = c.permissionOverwrites?.cache?.get(everyoneId);
        if (everyoneOverwrites) {
          if (c.isTextBased && c.isTextBased() && everyoneOverwrites.deny?.has(PermissionFlagsBits.SendMessages)) {
            isLocked = true;
          } else if (c.isVoiceBased && c.isVoiceBased() && everyoneOverwrites.deny?.has(PermissionFlagsBits.Connect)) {
            isLocked = true;
          }
        }

        return {
          id: c.id,
          name: c.name,
          type: c.type,
          typeName: ChannelType[c.type] || 'Unknown',
          parentId: c.parentId,
          parentName: c.parent ? c.parent.name : null,
          position: c.position,
          topic: c.topic || null,
          nsfw: c.nsfw || false,
          rateLimitPerUser: c.rateLimitPerUser || 0,
          bitrate: c.bitrate || null,
          userLimit: c.userLimit || null,
          isLocked,
        };
      });

    return channels;
  }

  /**
   * Create channel
   */
  async createChannel(guildId, data, executor) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const type = data.type !== undefined ? parseInt(data.type, 10) : ChannelType.GuildText;

    const channel = await guild.channels.create({
      name: data.name,
      type,
      parent: data.parentId || undefined,
      topic: data.topic || undefined,
      rateLimitPerUser: data.rateLimitPerUser !== undefined ? data.rateLimitPerUser : undefined,
      nsfw: Boolean(data.nsfw),
      bitrate: data.bitrate || undefined,
      userLimit: data.userLimit || undefined,
    });

    await this.logAction({
      guildId,
      action: 'CHANNEL_CREATE',
      targetId: channel.id,
      targetName: channel.name,
      executorId: executor.id,
      executorTag: executor.tag || executor.username,
      source: 'WEB_PANEL',
      details: { type: ChannelType[channel.type], parentId: data.parentId },
    });

    return channel;
  }

  /**
   * Edit channel
   */
  async editChannel(guildId, channelId, data, executor) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error('Channel not found');

    const editData = {};
    if (data.name) editData.name = data.name;
    if (data.topic !== undefined) editData.topic = data.topic;
    if (data.parentId !== undefined) editData.parent = data.parentId || null;
    if (data.rateLimitPerUser !== undefined) editData.rateLimitPerUser = data.rateLimitPerUser;
    if (data.nsfw !== undefined) editData.nsfw = Boolean(data.nsfw);
    if (data.position !== undefined) editData.position = data.position;
    if (data.bitrate !== undefined && channel.isVoiceBased()) editData.bitrate = data.bitrate;
    if (data.userLimit !== undefined && channel.isVoiceBased()) editData.userLimit = data.userLimit;

    await channel.edit(editData);

    await this.logAction({
      guildId,
      action: 'CHANNEL_EDIT',
      targetId: channel.id,
      targetName: channel.name,
      executorId: executor.id,
      executorTag: executor.tag || executor.username,
      source: 'WEB_PANEL',
      details: editData,
    });

    return channel;
  }

  /**
   * Delete channel
   */
  async deleteChannel(guildId, channelId, executor) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error('Channel not found');

    const channelName = channel.name;
    await channel.delete(`Deleted via Web Panel by ${executor.username}`);

    await this.logAction({
      guildId,
      action: 'CHANNEL_DELETE',
      targetId: channelId,
      targetName: channelName,
      executorId: executor.id,
      executorTag: executor.tag || executor.username,
      source: 'WEB_PANEL',
      details: {},
    });

    return { success: true, id: channelId, name: channelName };
  }

  /**
   * Clone channel
   */
  async cloneChannel(guildId, channelId, newName, executor) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error('Channel not found');

    const cloned = await channel.clone({
      name: newName || `${channel.name}-copy`,
    });

    await this.logAction({
      guildId,
      action: 'CHANNEL_CLONE',
      targetId: cloned.id,
      targetName: cloned.name,
      executorId: executor.id,
      executorTag: executor.tag || executor.username,
      source: 'WEB_PANEL',
      details: { sourceChannel: channel.name, sourceId: channel.id },
    });

    return cloned;
  }

  /**
   * Lock channel
   */
  async lockChannel(guildId, channelId, reason = 'Locked via Web Panel', executor) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error('Channel not found');

    if (channel.isTextBased()) {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: false,
        AddReactions: false,
        CreatePublicThreads: false,
      }, { reason });
    } else if (channel.isVoiceBased()) {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        Connect: false,
      }, { reason });
    }

    await this.logAction({
      guildId,
      action: 'CHANNEL_LOCK',
      targetId: channel.id,
      targetName: channel.name,
      executorId: executor.id,
      executorTag: executor.tag || executor.username,
      source: 'WEB_PANEL',
      details: { reason },
    });

    return { success: true, channelId, isLocked: true };
  }

  /**
   * Unlock channel
   */
  async unlockChannel(guildId, channelId, executor) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error('Channel not found');

    if (channel.isTextBased()) {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: null,
        AddReactions: null,
        CreatePublicThreads: null,
      });
    } else if (channel.isVoiceBased()) {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        Connect: null,
      });
    }

    await this.logAction({
      guildId,
      action: 'CHANNEL_UNLOCK',
      targetId: channel.id,
      targetName: channel.name,
      executorId: executor.id,
      executorTag: executor.tag || executor.username,
      source: 'WEB_PANEL',
      details: {},
    });

    return { success: true, channelId, isLocked: false };
  }

  /**
   * Get roles
   */
  async getRoles(guildId) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    return guild.roles.cache
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position,
        isEveryone: r.id === guild.id,
        memberCount: r.members.size,
      }));
  }

  /**
   * Get permission overwrites for a channel
   */
  async getChannelPermissions(guildId, channelId) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error('Channel not found');

    return channel.permissionOverwrites.cache.map((po) => {
      const isRole = po.type === 0;
      const targetObj = isRole ? guild.roles.cache.get(po.id) : guild.members.cache.get(po.id);
      return {
        id: po.id,
        type: po.type === 0 ? 'role' : 'member',
        name: targetObj ? (isRole ? targetObj.name : targetObj.user.username) : 'Unknown',
        allow: po.allow.toArray(),
        deny: po.deny.toArray(),
      };
    });
  }

  /**
   * Set channel permission overwrite
   */
  async setChannelPermission(guildId, channelId, targetId, { allow = [], deny = [] }, executor) {
    const guild = await this.getGuild(guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error('Channel not found');

    const allowBits = allow.reduce((acc, perm) => {
      return PermissionFlagsBits[perm] ? acc | PermissionFlagsBits[perm] : acc;
    }, 0n);

    const denyBits = deny.reduce((acc, perm) => {
      return PermissionFlagsBits[perm] ? acc | PermissionFlagsBits[perm] : acc;
    }, 0n);

    await channel.permissionOverwrites.edit(targetId, {
      ...allow.reduce((acc, p) => ({ ...acc, [p]: true }), {}),
      ...deny.reduce((acc, p) => ({ ...acc, [p]: false }), {}),
    });

    await this.logAction({
      guildId,
      action: 'PERMISSION_OVERWRITE_UPDATE',
      targetId: channel.id,
      targetName: channel.name,
      executorId: executor.id,
      executorTag: executor.tag || executor.username,
      source: 'WEB_PANEL',
      details: { targetId, allow, deny },
    });

    return { success: true };
  }

  /**
   * Helper to write audit log and dispatch to discord
   */
  async logAction(data) {
    const { recordAuditLog } = require('../../../bot/src/utils/logger');
    await recordAuditLog({
      ...data,
      client,
    });
  }
}

module.exports = new DiscordService();

