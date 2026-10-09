const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { hasManageChannels, createPermissionErrorEmbed } = require('../utils/permissions');
const { createConfirmationPrompt } = require('../utils/confirmations');

/**
 * Handle String Select Menu interactions
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 */
async function handleSelectMenuInteraction(interaction) {
  const { customId, values, guild, member } = interaction;

  if (!hasManageChannels(member)) {
    return interaction.reply({
      embeds: [createPermissionErrorEmbed('user', ['Manage Channels'])],
      ephemeral: true,
    });
  }

  // 1. Category selected from list
  if (customId === 'menu_category_select') {
    const categoryId = values[0];
    const category = guild.channels.cache.get(categoryId);

    if (!category) {
      return interaction.update({
        content: '⚠️ Category not found or deleted.',
        embeds: [],
        components: [],
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📁 Category: ${category.name}`)
      .setDescription(`Position: **${category.position}** | Child Channels: **${category.children.cache.size}**\n\nChoose an action below:`)
      .setFooter({ text: `ID: ${category.id}` });

    const actionMenu = new StringSelectMenuBuilder()
      .setCustomId(`menu_category_action:${category.id}`)
      .setPlaceholder('Choose an action to perform...')
      .addOptions([
        { label: 'Rename Category', value: 'action_cat_rename', description: 'Change category name', emoji: '✏️' },
        { label: 'View Channels', value: 'action_cat_view_channels', description: 'List all channels in category', emoji: '📜' },
        { label: 'Delete Category', value: 'action_cat_delete', description: 'Permanently delete this category', emoji: '🗑️' },
      ]);

    return interaction.update({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(actionMenu)],
    });
  }

  // 2. Action selected on a category
  if (customId.startsWith('menu_category_action:')) {
    const categoryId = customId.split(':')[1];
    const category = guild.channels.cache.get(categoryId);
    const action = values[0];

    if (!category) {
      return interaction.update({ content: '⚠️ Category no longer exists.', embeds: [], components: [] });
    }

    if (action === 'action_cat_rename') {
      const modal = new ModalBuilder()
        .setCustomId(`modal_cat_edit:${category.id}`)
        .setTitle(`Rename ${category.name.slice(0, 30)}`);

      const nameInput = new TextInputBuilder()
        .setCustomId('cat_new_name')
        .setLabel('New Category Name')
        .setValue(category.name)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
      return interaction.showModal(modal);
    }

    if (action === 'action_cat_view_channels') {
      const children = category.children.cache;
      const desc = children.map((c) => `<#${c.id}> (\`${c.name}\`) - ${ChannelType[c.type]}`).join('\n') || 'No channels in this category.';
      
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Channels in ${category.name}`)
        .setDescription(desc.slice(0, 4000));

      return interaction.update({ embeds: [embed], components: [] });
    }

    if (action === 'action_cat_delete') {
      const { embed, row } = createConfirmationPrompt({
        title: 'Delete Category Confirmation',
        description: `Are you sure you want to delete **${category.name}**?`,
        confirmCustomId: `confirm_cat_del:${category.id}`,
      });

      return interaction.update({ embeds: [embed], components: [row] });
    }
  }

  // 3. Channel selected from list
  if (customId === 'menu_channel_select') {
    const channelId = values[0];
    const channel = guild.channels.cache.get(channelId);

    if (!channel) {
      return interaction.update({ content: '⚠️ Channel not found or deleted.', embeds: [], components: [] });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`💬 Channel: ${channel.name}`)
      .setDescription(
        `Type: **${ChannelType[channel.type]}**\n` +
        `Category: **${channel.parent ? channel.parent.name : 'None'}**\n` +
        `Topic: ${channel.topic || '*None*'}\n\n` +
        'Choose an action to perform below:'
      )
      .setFooter({ text: `ID: ${channel.id}` });

    const actionMenu = new StringSelectMenuBuilder()
      .setCustomId(`menu_channel_action:${channel.id}`)
      .setPlaceholder('Choose channel action...')
      .addOptions([
        { label: 'Edit Settings', value: 'action_chan_edit', description: 'Change name and topic', emoji: '✏️' },
        { label: 'Lock Channel', value: 'action_chan_lock', description: 'Prevent members from sending messages', emoji: '🔒' },
        { label: 'Unlock Channel', value: 'action_chan_unlock', description: 'Restore default member permissions', emoji: '🔓' },
        { label: 'Clone Channel', value: 'action_chan_clone', description: 'Duplicate channel with permissions', emoji: '📋' },
        { label: 'Delete Channel', value: 'action_chan_delete', description: 'Permanently delete this channel', emoji: '🗑️' },
      ]);

    return interaction.update({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(actionMenu)],
    });
  }

  // 4. Action selected on a channel
  if (customId.startsWith('menu_channel_action:')) {
    const channelId = customId.split(':')[1];
    const channel = guild.channels.cache.get(channelId);
    const action = values[0];

    if (!channel) {
      return interaction.update({ content: '⚠️ Channel no longer exists.', embeds: [], components: [] });
    }

    if (action === 'action_chan_edit') {
      const modal = new ModalBuilder()
        .setCustomId(`modal_chan_edit:${channel.id}`)
        .setTitle(`Edit #${channel.name.slice(0, 30)}`);

      const nameInput = new TextInputBuilder()
        .setCustomId('chan_new_name')
        .setLabel('New Channel Name')
        .setValue(channel.name)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const topicInput = new TextInputBuilder()
        .setCustomId('chan_new_topic')
        .setLabel('New Topic')
        .setValue(channel.topic || '')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(topicInput)
      );

      return interaction.showModal(modal);
    }

    if (action === 'action_chan_lock') {
      try {
        if (channel.isTextBased()) {
          await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: false,
            AddReactions: false,
          });
        }
        return interaction.update({
          content: `🔒 Channel <#${channel.id}> has been locked.`,
          embeds: [],
          components: [],
        });
      } catch (err) {
        return interaction.update({
          content: `❌ Failed to lock: ${err.message}`,
          embeds: [],
          components: [],
        });
      }
    }

    if (action === 'action_chan_unlock') {
      try {
        if (channel.isTextBased()) {
          await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: null,
            AddReactions: null,
          });
        }
        return interaction.update({
          content: `🔓 Channel <#${channel.id}> has been unlocked.`,
          embeds: [],
          components: [],
        });
      } catch (err) {
        return interaction.update({
          content: `❌ Failed to unlock: ${err.message}`,
          embeds: [],
          components: [],
        });
      }
    }

    if (action === 'action_chan_clone') {
      try {
        const cloned = await channel.clone({ name: `${channel.name}-copy` });
        return interaction.update({
          content: `✅ Cloned channel to <#${cloned.id}>.`,
          embeds: [],
          components: [],
        });
      } catch (err) {
        return interaction.update({
          content: `❌ Failed to clone: ${err.message}`,
          embeds: [],
          components: [],
        });
      }
    }

    if (action === 'action_chan_delete') {
      const { embed, row } = createConfirmationPrompt({
        title: 'Delete Channel Confirmation',
        description: `Are you sure you want to delete <#${channel.id}>?`,
        confirmCustomId: `confirm_chan_del:${channel.id}`,
      });

      return interaction.update({ embeds: [embed], components: [row] });
    }
  }
}

module.exports = {
  handleSelectMenuInteraction,
};

