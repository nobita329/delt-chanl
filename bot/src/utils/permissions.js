const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

/**
 * Check if a guild member has Manage Channels or Administrator permission
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function hasManageChannels(member) {
  if (!member) return false;
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageChannels)
  );
}

/**
 * Check if a guild member has Manage Guild or Administrator permission
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function hasManageGuild(member) {
  if (!member) return false;
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  );
}

/**
 * Check if the bot has required permissions in a guild or channel
 * @param {import('discord.js').Guild} guild
 * @param {bigint[]} requiredPermissions
 * @param {import('discord.js').GuildChannel} [channel]
 * @returns {{ hasPermission: boolean, missing: string[] }}
 */
function checkBotPermissions(guild, requiredPermissions = [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ViewChannel], channel = null) {
  const botMember = guild.members.me;
  if (!botMember) {
    return { hasPermission: false, missing: ['Bot member not found in guild'] };
  }

  const permissions = channel ? channel.permissionsFor(botMember) : botMember.permissions;
  const missing = [];

  for (const perm of requiredPermissions) {
    if (!permissions.has(perm)) {
      // Find permission name
      const name = Object.keys(PermissionFlagsBits).find((key) => PermissionFlagsBits[key] === perm);
      missing.push(name || 'Unknown Permission');
    }
  }

  return {
    hasPermission: missing.length === 0,
    missing,
  };
}

/**
 * Creates an embed describing missing permissions
 * @param {string} userOrBot 'user' or 'bot'
 * @param {string[]} missing
 */
function createPermissionErrorEmbed(userOrBot, missing) {
  return new EmbedBuilder()
    .setColor('#f23f43')
    .setTitle('⚠️ Permission Denied')
    .setDescription(
      userOrBot === 'user'
        ? `You do not have the required permissions to perform this action.\n**Required:** \`${missing.join('`, `')}\``
        : `The bot lacks necessary Discord permissions to perform this action.\n**Missing:** \`${missing.join('`, `')}\`\nPlease grant these permissions to the bot role.`
    )
    .setFooter({ text: 'Discord Server Manager Security' })
    .setTimestamp();
}

module.exports = {
  hasManageChannels,
  hasManageGuild,
  checkBotPermissions,
  createPermissionErrorEmbed,
};

