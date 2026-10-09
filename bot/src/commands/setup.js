const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const prisma = require('../../../backend/src/config/prisma');
const { hasManageGuild, createPermissionErrorEmbed } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure bot settings for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName('log_channel')
        .setDescription('Channel where server management actions will be logged')
        .addChannelTypes(ChannelType.GuildText)
    )
    .addRoleOption((opt) =>
      opt
        .setName('manager_role')
        .setDescription('Role authorized to use bot management features')
    )
    .addBooleanOption((opt) =>
      opt
        .setName('audit_logging')
        .setDescription('Enable or disable audit logging to channel')
    ),

  async execute(interaction) {
    if (!hasManageGuild(interaction.member)) {
      return interaction.reply({
        embeds: [createPermissionErrorEmbed('user', ['Manage Guild'])],
        ephemeral: true,
      });
    }

    const logChannel = interaction.options.getChannel('log_channel');
    const managerRole = interaction.options.getRole('manager_role');
    const auditLogging = interaction.options.getBoolean('audit_logging');

    if (!logChannel && !managerRole && auditLogging === null) {
      // Return current setup
      const current = await prisma.guildSetting.findUnique({
        where: { guildId: interaction.guild.id },
      });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`⚙️ Bot Configuration for ${interaction.guild.name}`)
        .addFields(
          {
            name: 'Audit Log Channel',
            value: current?.logChannelId ? `<#${current.logChannelId}>` : '*None configured*',
            inline: true,
          },
          {
            name: 'Manager Role',
            value: current?.managerRoleId ? `<@&${current.managerRoleId}>` : '*Administrators only*',
            inline: true,
          },
          {
            name: 'Audit Logging Status',
            value: current?.auditLogEnabled ? '✅ Enabled' : '❌ Disabled',
            inline: true,
          }
        )
        .setFooter({ text: 'Use /setup options to update these values' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const updateData = {};
    if (logChannel) updateData.logChannelId = logChannel.id;
    if (managerRole) updateData.managerRoleId = managerRole.id;
    if (auditLogging !== null) updateData.auditLogEnabled = auditLogging;

    await prisma.guildSetting.upsert({
      where: { guildId: interaction.guild.id },
      update: updateData,
      create: {
        guildId: interaction.guild.id,
        ...updateData,
      },
    });

    const embed = new EmbedBuilder()
      .setColor('#23a55a')
      .setTitle('✅ Configuration Updated')
      .setDescription('Bot settings for this server have been successfully updated.')
      .addFields(
        { name: 'Log Channel', value: logChannel ? `<#${logChannel.id}>` : 'Unchanged', inline: true },
        { name: 'Manager Role', value: managerRole ? `<@&${managerRole.id}>` : 'Unchanged', inline: true },
        {
          name: 'Audit Logging',
          value: auditLogging !== null ? (auditLogging ? 'Enabled' : 'Disabled') : 'Unchanged',
          inline: true,
        }
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};

