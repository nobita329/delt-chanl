const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display bot documentation, slash commands, and web panel information'),

  async execute(interaction) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📖 Discord Server Manager Bot — Guide')
      .setDescription(
        'Comprehensive Discord Server and Channel Management Bot paired with a real-time Web Panel.'
      )
      .addFields(
        {
          name: '📁 Category Management (`/category`)',
          value:
            '• `/category create [name] [position]` — Create a new category\n' +
            '• `/category delete [category]` — Delete with confirmation\n' +
            '• `/category edit [category] [name] [position]` — Update category\n' +
            '• `/category list` — View all categories & channel counts\n' +
            '• `/category move [category] [position]` — Change position\n' +
            '• `/category menu` — Open interactive dropdown category selector',
          inline: false,
        },
        {
          name: '💬 Channel Management (`/channel`)',
          value:
            '• `/channel create [name] [type] [category] ...` — Create text, voice, announcement, or forum channel\n' +
            '• `/channel delete [channel]` — Delete with confirmation\n' +
            '• `/channel edit [channel] [name] [topic] [slowmode]` — Edit settings\n' +
            '• `/channel clone [channel] [name]` — Clone with permissions\n' +
            '• `/channel category [channel] [parent]` — Move into category\n' +
            '• `/channel lock [channel] [reason]` — Lock channel\n' +
            '• `/channel unlock [channel]` — Restore permissions\n' +
            '• `/channel slowmode [channel] [seconds]` — Set slowmode\n' +
            '• `/channel menu` — Interactive channel management selector',
          inline: false,
        },
        {
          name: '🛡️ Server & Diagnostics',
          value:
            '• `/server info` — Server details, owner, boost level\n' +
            '• `/server channels` — Channel breakdown statistics\n' +
            '• `/setup` — Configure audit logging channel & manager role\n' +
            '• `/logs` — View recent management audit trail',
          inline: false,
        },
        {
          name: '🌐 Web Management Panel',
          value: `Manage your server visually via the Web Panel at: [Dashboard Link](${frontendUrl})`,
          inline: false,
        }
      )
      .setFooter({ text: 'Requires Manage Channels or Administrator permission' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Open Web Panel')
        .setStyle(ButtonStyle.Link)
        .setURL(frontendUrl)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};

