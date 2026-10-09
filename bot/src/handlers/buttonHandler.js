const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const { hasManageChannels, checkBotPermissions, createPermissionErrorEmbed } = require('../utils/permissions');
const { recordAuditLog } = require('../utils/logger');

/**
 * Handle button interactions
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleButtonInteraction(interaction) {
  const { customId, guild, member, user } = interaction;

  if (customId === 'cancel_action') {
    return interaction.update({
      content: '❌ Action cancelled.',
      embeds: [],
      components: [],
    });
  }

  // Check user permission
  if (!hasManageChannels(member)) {
    return interaction.reply({
      embeds: [createPermissionErrorEmbed('user', ['Manage Channels'])],
      ephemeral: true,
    });
  }

  // 1. CONFIRM CHANNEL DELETE
  if (customId.startsWith('confirm_chan_del:')) {
    const channelId = customId.split(':')[1];
    const channel = guild.channels.cache.get(channelId);

    if (!channel) {
      return interaction.update({
        content: '⚠️ Channel no longer exists or was already deleted.',
        embeds: [],
        components: [],
      });
    }

    const botCheck = checkBotPermissions(guild, undefined, channel);
    if (!botCheck.hasPermission) {
      return interaction.update({
        embeds: [createPermissionErrorEmbed('bot', botCheck.missing)],
        components: [],
      });
    }

    try {
      const channelName = channel.name;
      await channel.delete(`Deleted via bot by ${user.tag}`);

      await recordAuditLog({
        guildId: guild.id,
        action: 'CHANNEL_DELETE',
        targetId: channelId,
        targetName: channelName,
        executorId: user.id,
        executorTag: user.tag,
        source: 'DISCORD_BOT',
        details: {},
        client: interaction.client,
      });

      return interaction.update({
        content: `✅ Successfully deleted channel **#${channelName}** (\`${channelId}\`).`,
        embeds: [],
        components: [],
      });
    } catch (err) {
      return interaction.update({
        content: `❌ Failed to delete channel: ${err.message}`,
        embeds: [],
        components: [],
      });
    }
  }

  // 2. CONFIRM CATEGORY DELETE
  if (customId.startsWith('confirm_cat_del:')) {
    const categoryId = customId.split(':')[1];
    const category = guild.channels.cache.get(categoryId);

    if (!category) {
      return interaction.update({
        content: '⚠️ Category no longer exists or was already deleted.',
        embeds: [],
        components: [],
      });
    }

    try {
      const categoryName = category.name;
      const childCount = category.children.cache.size;

      // Delete all channels inside this category
      const deletedChildren = [];
      const children = Array.from(category.children.cache.values());
      for (const child of children) {
        try {
          await child.delete(`Deleted with parent category ${categoryName} by ${user.tag}`);
          deletedChildren.push(child.name);
        } catch (err) {
          console.error(`Failed to delete child channel ${child.id}:`, err);
        }
      }

      await category.delete(`Deleted via bot by ${user.tag}`);

      await recordAuditLog({
        guildId: guild.id,
        action: 'CATEGORY_DELETE',
        targetId: categoryId,
        targetName: categoryName,
        executorId: user.id,
        executorTag: user.tag,
        source: 'DISCORD_BOT',
        details: { deletedChannelsCount: deletedChildren.length, deletedChannels: deletedChildren },
        client: interaction.client,
      });

      return interaction.update({
        content: `✅ Successfully deleted category **${categoryName}** (\`${categoryId}\`) and all **${deletedChildren.length}** channel(s) inside it.`,
        embeds: [],
        components: [],
      });
    } catch (err) {
      return interaction.update({
        content: `❌ Failed to delete category: ${err.message}`,
        embeds: [],
        components: [],
      });
    }
  }

  // 3. TRIGGER CREATE CATEGORY MODAL
  if (customId === 'btn_category_create') {
    const modal = new ModalBuilder()
      .setCustomId('modal_cat_create')
      .setTitle('Create New Category');

    const nameInput = new TextInputBuilder()
      .setCustomId('cat_name')
      .setLabel('Category Name')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const posInput = new TextInputBuilder()
      .setCustomId('cat_position')
      .setLabel('Position (Optional order number)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('0, 1, 2...');

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(posInput)
    );

    return interaction.showModal(modal);
  }

  // 4. TRIGGER CREATE CHANNEL MODAL
  if (customId === 'btn_channel_create') {
    const modal = new ModalBuilder()
      .setCustomId('modal_chan_create')
      .setTitle('Create New Text Channel');

    const nameInput = new TextInputBuilder()
      .setCustomId('chan_name')
      .setLabel('Channel Name')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('e.g. general-chat');

    const topicInput = new TextInputBuilder()
      .setCustomId('chan_topic')
      .setLabel('Topic (Optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(topicInput)
    );

    return interaction.showModal(modal);
  }
}

module.exports = {
  handleButtonInteraction,
};

