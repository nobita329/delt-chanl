const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('View server information and channel breakdowns')
    .addSubcommand((sub) =>
      sub.setName('info').setDescription('Display detailed server information')
    )
    .addSubcommand((sub) =>
      sub.setName('channels').setDescription('Display channel counts and breakdown')
    ),

  async execute(interaction) {
    const { guild } = interaction;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'info') {
      const owner = await guild.fetchOwner().catch(() => null);
      const textCount = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
      const voiceCount = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
      const categoryCount = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`🛡️ ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: 'Server ID', value: `\`${guild.id}\``, inline: true },
          { name: 'Owner', value: owner ? `${owner.user.tag} (<@${owner.id}>)` : 'Unknown', inline: true },
          { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Members', value: `👥 **${guild.memberCount}**`, inline: true },
          { name: 'Roles', value: `🎭 **${guild.roles.cache.size}**`, inline: true },
          { name: 'Boost Level', value: `🚀 Level **${guild.premiumTier}** (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
          { name: 'Categories', value: `📁 **${categoryCount}**`, inline: true },
          { name: 'Text Channels', value: `💬 **${textCount}**`, inline: true },
          { name: 'Voice Channels', value: `🔊 **${voiceCount}**`, inline: true }
        )
        .setFooter({ text: 'Discord Server Manager' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'channels') {
      const total = guild.channels.cache.size;
      const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;
      const text = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
      const voice = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
      const announcements = guild.channels.cache.filter((c) => c.type === ChannelType.GuildAnnouncement).size;
      const forums = guild.channels.cache.filter((c) => c.type === ChannelType.GuildForum).size;

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📊 Channel Breakdown for ${guild.name}`)
        .addFields(
          { name: 'Total Channels & Categories', value: `**${total}**`, inline: false },
          { name: '📁 Categories', value: `${categories}`, inline: true },
          { name: '💬 Text Channels', value: `${text}`, inline: true },
          { name: '🔊 Voice Channels', value: `${voice}`, inline: true },
          { name: '📢 Announcement Channels', value: `${announcements}`, inline: true },
          { name: '📋 Forum Channels', value: `${forums}`, inline: true }
        )
        .setFooter({ text: 'Discord Server Manager' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

