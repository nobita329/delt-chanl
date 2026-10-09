const { ChannelType, EmbedBuilder } = require('discord.js');
const { hasManageChannels, createPermissionErrorEmbed } = require('../utils/permissions');
const { recordAuditLog } = require('../utils/logger');

/**
 * Handle Modal submissions
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleModalSubmission(interaction) {
  const { customId, guild, member, user } = interaction;

  if (!hasManageChannels(member)) {
    return interaction.reply({
      embeds: [createPermissionErrorEmbed('user', ['Manage Channels'])],
      ephemeral: true,
    });
  }

  // 1. CREATE CATEGORY MODAL
  if (customId === 'modal_cat_create') {
    const name = interaction.fields.getTextInputValue('cat_name');
    const posStr = interaction.fields.getTextInputValue('cat_position');
    const position = posStr ? parseInt(posStr, 10) : undefined;

    await interaction.deferReply({ ephemeral: true });

    try {
      const category = await guild.channels.create({
        name,
        type: ChannelType.GuildCategory,
        position: isNaN(position) ? undefined : position,
      });

      await recordAuditLog({
        guildId: guild.id,
        action: 'CATEGORY_CREATE',
        targetId: category.id,
        targetName: category.name,
        executorId: user.id,
        executorTag: user.tag,
        source: 'DISCORD_BOT',
        details: { createdVia: 'modal' },
        client: interaction.client,
      });

      return interaction.editReply({
        content: `✅ Successfully created category **${category.name}** (\`${category.id}\`).`,
      });
    } catch (err) {
      return interaction.editReply({
        content: `❌ Failed to create category: ${err.message}`,
      });
    }
  }

  // 2. EDIT CATEGORY MODAL
  if (customId.startsWith('modal_cat_edit:')) {
    const categoryId = customId.split(':')[1];
    const category = guild.channels.cache.get(categoryId);
    const newName = interaction.fields.getTextInputValue('cat_new_name');

    if (!category) {
      return interaction.reply({ content: '⚠️ Category no longer exists.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const oldName = category.name;
      await category.setName(newName);

      await recordAuditLog({
        guildId: guild.id,
        action: 'CATEGORY_EDIT',
        targetId: category.id,
        targetName: newName,
        executorId: user.id,
        executorTag: user.tag,
        source: 'DISCORD_BOT',
        details: { oldName, newName },
        client: interaction.client,
      });

      return interaction.editReply({
        content: `✅ Category renamed from **${oldName}** to **${newName}**.`,
      });
    } catch (err) {
      return interaction.editReply({
        content: `❌ Failed to rename category: ${err.message}`,
      });
    }
  }

  // 3. CREATE CHANNEL MODAL
  if (customId === 'modal_chan_create') {
    const name = interaction.fields.getTextInputValue('chan_name');
    const topic = interaction.fields.getTextInputValue('chan_topic');

    await interaction.deferReply({ ephemeral: true });

    try {
      const channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        topic: topic || undefined,
      });

      await recordAuditLog({
        guildId: guild.id,
        action: 'CHANNEL_CREATE',
        targetId: channel.id,
        targetName: channel.name,
        executorId: user.id,
        executorTag: user.tag,
        source: 'DISCORD_BOT',
        details: { topic },
        client: interaction.client,
      });

      return interaction.editReply({
        content: `✅ Successfully created text channel <#${channel.id}>.`,
      });
    } catch (err) {
      return interaction.editReply({
        content: `❌ Failed to create channel: ${err.message}`,
      });
    }
  }

  // 4. EDIT CHANNEL MODAL
  if (customId.startsWith('modal_chan_edit:')) {
    const channelId = customId.split(':')[1];
    const channel = guild.channels.cache.get(channelId);
    const newName = interaction.fields.getTextInputValue('chan_new_name');
    const newTopic = interaction.fields.getTextInputValue('chan_new_topic');

    if (!channel) {
      return interaction.reply({ content: '⚠️ Channel no longer exists.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await channel.edit({
        name: newName,
        topic: newTopic || null,
      });

      await recordAuditLog({
        guildId: guild.id,
        action: 'CHANNEL_EDIT',
        targetId: channel.id,
        targetName: newName,
        executorId: user.id,
        executorTag: user.tag,
        source: 'DISCORD_BOT',
        details: { newName, newTopic },
        client: interaction.client,
      });

      return interaction.editReply({
        content: `✅ Channel <#${channel.id}> settings updated successfully.`,
      });
    } catch (err) {
      return interaction.editReply({
        content: `❌ Failed to edit channel: ${err.message}`,
      });
    }
  }
}

module.exports = {
  handleModalSubmission,
};

