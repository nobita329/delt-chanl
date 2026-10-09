const { EmbedBuilder } = require('discord.js');
const prisma = require('../../../backend/src/config/prisma');

/**
 * Log action to Database and optionally to the guild's log channel
 * @param {object} params
 * @param {string} params.guildId
 * @param {string} params.action - e.g. "CHANNEL_CREATE", "CATEGORY_DELETE"
 * @param {string} [params.targetId]
 * @param {string} [params.targetName]
 * @param {string} params.executorId
 * @param {string} params.executorTag
 * @param {'WEB_PANEL'|'DISCORD_BOT'} [params.source='DISCORD_BOT']
 * @param {object|string} [params.details]
 * @param {import('discord.js').Client} [params.client]
 */
async function recordAuditLog({
  guildId,
  action,
  targetId = null,
  targetName = null,
  executorId,
  executorTag,
  source = 'DISCORD_BOT',
  details = null,
  client = null,
}) {
  const detailsStr = typeof details === 'object' && details !== null ? JSON.stringify(details) : details;

  // 1. Persist to Prisma SQLite
  try {
    await prisma.auditLog.create({
      data: {
        guildId,
        action,
        targetId,
        targetName,
        executorId,
        executorTag,
        source,
        details: detailsStr,
      },
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to save audit log to DB:', err);
  }

  // 2. Dispatch to Discord Log Channel if configured
  if (client) {
    try {
      const setting = await prisma.guildSetting.findUnique({
        where: { guildId },
      });

      if (setting && setting.logChannelId && setting.auditLogEnabled) {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          const logChannel = guild.channels.cache.get(setting.logChannelId);
          if (logChannel && logChannel.isTextBased()) {
            const embed = new EmbedBuilder()
              .setColor(action.includes('DELETE') ? '#f23f43' : action.includes('CREATE') ? '#23a55a' : '#5865F2')
              .setTitle(`📋 Audit Log: ${action.replace(/_/g, ' ')}`)
              .addFields(
                { name: 'Target', value: targetName ? `**${targetName}** (${targetId || 'N/A'})` : (targetId || 'N/A'), inline: true },
                { name: 'Executor', value: `**${executorTag}** (<@${executorId}>)`, inline: true },
                { name: 'Source', value: `\`${source}\``, inline: true }
              )
              .setFooter({ text: `Guild: ${guild.name}` })
              .setTimestamp();

            if (detailsStr) {
              embed.addFields({ name: 'Details', value: `\`\`\`json\n${detailsStr.slice(0, 1000)}\n\`\`\`` });
            }

            await logChannel.send({ embeds: [embed] }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('[AuditLogger] Failed to dispatch Discord log channel message:', err);
    }
  }
}

module.exports = {
  recordAuditLog,
};

