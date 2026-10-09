const axios = require('axios');
const discordService = require('../services/discordService');

// In-memory cache for user guilds to avoid hitting Discord rate limits on every API call (TTL: 60s)
const userGuildsCache = new Map();

/**
 * Fetch and cache user's guilds from Discord API
 */
async function getUserGuilds(accessToken, userId) {
  const cached = userGuildsCache.get(userId);
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.guilds;
  }

  try {
    const response = await axios.get('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 5000,
    });

    const guilds = response.data;
    userGuildsCache.set(userId, { guilds, timestamp: Date.now() });
    return guilds;
  } catch (err) {
    console.error('[guildPerms] Failed to fetch user guilds from Discord:', err.message);
    if (cached) return cached.guilds; // return stale cache if available
    return [];
  }
}

/**
 * Middleware to ensure the user has Manage Guild or Administrator permissions in the requested guild
 */
async function requireGuildPermission(req, res, next) {
  try {
    const { guildId } = req.params;
    const user = req.user;

    if (!guildId) {
      return res.status(400).json({ error: 'Missing guildId parameter' });
    }

    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'User not authorized or missing Discord token' });
    }

    // 1. Check user permissions in guild
    const userGuilds = await getUserGuilds(user.accessToken, user.id);
    const targetGuild = userGuilds.find((g) => g.id === guildId);

    if (!targetGuild) {
      return res.status(403).json({ error: 'You are not a member of this Discord server' });
    }

    // Check MANAGE_GUILD (0x20) or ADMINISTRATOR (0x8) or owner
    const perms = BigInt(targetGuild.permissions || '0');
    const hasManageGuild = (perms & 0x20n) === 0x20n;
    const hasAdmin = (perms & 0x8n) === 0x8n;
    const isOwner = targetGuild.owner === true;

    if (!hasManageGuild && !hasAdmin && !isOwner) {
      return res.status(403).json({
        error: 'Forbidden: You must have Manage Server or Administrator permission in this server',
      });
    }

    // 2. Check if the Bot is present in the server
    if (!discordService.isBotInGuild(guildId)) {
      return res.status(404).json({
        error: 'Bot is not in this server. Please invite the bot first.',
        botMissing: true,
      });
    }

    req.guildId = guildId;
    req.userGuild = targetGuild;
    next();
  } catch (err) {
    console.error('[requireGuildPermission Error]:', err);
    return res.status(500).json({ error: 'Failed to verify guild permissions' });
  }
}

module.exports = {
  requireGuildPermission,
  getUserGuilds,
};

