const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const prisma = require('../../../backend/src/config/prisma');
const { hasManageGuild, createPermissionErrorEmbed } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('View recent server management activity logs')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption((opt) =>
      opt
        .setName('limit')
        .setDescription('Number of logs to fetch (max 25)')
        .setMinValue(1)
        .setMaxValue(25)
    )
    .addStringOption((opt) =>
      opt
        .setName('action')
        .setDescription('Filter by action type')
        .addChoices(
          { name: 'Channel Create', value: 'CHANNEL_CREATE' },
          { name: 'Channel Delete', value: 'CHANNEL_DELETE' },
          { name: 'Channel Edit', value: 'CHANNEL_EDIT' },
          { name: 'Channel Lock', value: 'CHANNEL_LOCK' },
          { name: 'Channel Unlock', value: 'CHANNEL_UNLOCK' },
          { name: 'Category Create', value: 'CATEGORY_CREATE' },
          { name: 'Category Delete', value: 'CATEGORY_DELETE' }
        )
    ),

  async execute(interaction) {
    if (!hasManageGuild(interaction.member)) {
      return interaction.reply({
        embeds: [createPermissionErrorEmbed('user', ['Manage Guild'])],
        ephemeral: true,
      });
    }

    const limit = interaction.options.getInteger('limit') || 10;
    const actionFilter = interaction.options.getString('action');

    await interaction.deferReply({ ephemeral: true });

    try {
      const where = { guildId: interaction.guild.id };
      if (actionFilter) where.action = actionFilter;

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      if (logs.length === 0) {
        return interaction.editReply({
          content: 'ℹ️ No audit logs found matching your criteria.',
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📜 Recent Management Audit Logs (${logs.length})`)
        .setFooter({ text: interaction.guild.name })
        .setTimestamp();

      logs.forEach((log) => {
        const time = `<t:${Math.floor(new Date(log.createdAt).getTime() / 1000)}:R>`;
        const target = log.targetName ? `**${log.targetName}** (\`${log.targetId || 'N/A'}\`)` : `\`${log.targetId || 'N/A'}\``;
        embed.addFields({
          name: `${log.action} • ${time}`,
          value: `**Target:** ${target}\n**By:** ${log.executorTag} | **Source:** \`${log.source}\``,
          inline: false,
        });
      });

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return interaction.editReply({
        content: `❌ Failed to retrieve audit logs: ${err.message}`,
      });
    }
  },
};

