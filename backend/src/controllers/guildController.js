const { getUserGuilds } = require('../middleware/guildPerms');
const discordService = require('../services/discordService');
const config = require('../config/config');

class GuildController {
  /**
   * List guilds where user has Manage Guild or Administrator permissions
   */
  async listGuilds(req, res) {
    try {
      const user = req.user;
      const userGuilds = await getUserGuilds(user.accessToken, user.id);

      // Filter for guilds where user has Manage Guild (0x20) or Admin (0x8) or is owner
      const manageableGuilds = userGuilds
        .filter((g) => {
          const perms = BigInt(g.permissions || '0');
          const hasManageGuild = (perms & 0x20n) === 0x20n;
          const hasAdmin = (perms & 0x8n) === 0x8n;
          return hasManageGuild || hasAdmin || g.owner;
        })
        .map((g) => {
          const botPresent = discordService.isBotInGuild(g.id);
          const iconUrl = g.icon
            ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
            : null;

          const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${config.discord.clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${g.id}`;

          return {
            id: g.id,
            name: g.name,
            icon: iconUrl,
            owner: g.owner,
            permissions: g.permissions,
            botPresent,
            inviteUrl,
          };
        });

      return res.json({ guilds: manageableGuilds });
    } catch (err) {
      console.error('[GuildController listGuilds Error]:', err);
      return res.status(500).json({ error: 'Failed to retrieve servers' });
    }
  }

  /**
   * Get guild overview and channel statistics
   */
  async getOverview(req, res) {
    try {
      const { guildId } = req.params;
      const overview = await discordService.getGuildOverview(guildId);

      if (!overview) {
        return res.status(404).json({ error: 'Guild not found or bot does not have access' });
      }

      return res.json({ overview });
    } catch (err) {
      console.error('[GuildController getOverview Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch guild details' });
    }
  }
}

module.exports = new GuildController();

