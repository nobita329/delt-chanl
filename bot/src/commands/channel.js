const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { hasManageChannels, checkBotPermissions, createPermissionErrorEmbed } = require('../utils/permissions');
const { createConfirmationPrompt } = require('../utils/confirmations');
const { recordAuditLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel')
    .setDescription('Manage server channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    // 1. CREATE
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a new channel')
        .addStringOption((opt) => opt.setName('name').setDescription('Channel name').setRequired(true))
        .addIntegerOption((opt) =>
          opt
            .setName('type')
            .setDescription('Channel type')
            .setRequired(true)
            .addChoices(
              { name: 'Text Channel', value: ChannelType.GuildText },
              { name: 'Voice Channel', value: ChannelType.GuildVoice },
              { name: 'Announcement Channel', value: ChannelType.GuildAnnouncement },
              { name: 'Forum Channel', value: ChannelType.GuildForum }
            )
        )
        .addChannelOption((opt) =>
          opt
            .setName('category')
            .setDescription('Parent category (optional)')
            .addChannelTypes(ChannelType.GuildCategory)
        )
        .addStringOption((opt) => opt.setName('topic').setDescription('Channel topic (optional)'))
        .addIntegerOption((opt) => opt.setName('slowmode').setDescription('Slowmode in seconds (0-21600)'))
        .addBooleanOption((opt) => opt.setName('nsfw').setDescription('Mark channel as age-restricted / NSFW'))
    )
    // 2. DELETE
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete a channel after confirmation')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Select channel to delete')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
            .setRequired(true)
        )
    )
    // 3. EDIT
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Edit channel name, topic, or slowmode')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Select channel')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
            .setRequired(true)
        )
        .addStringOption((opt) => opt.setName('name').setDescription('New channel name'))
        .addStringOption((opt) => opt.setName('topic').setDescription('New channel topic'))
        .addIntegerOption((opt) => opt.setName('slowmode').setDescription('New slowmode in seconds'))
    )
    // 4. LIST
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('List all server channels grouped by category')
        .addChannelOption((opt) =>
          opt
            .setName('category')
            .setDescription('Filter by specific category')
            .addChannelTypes(ChannelType.GuildCategory)
        )
    )
    // 5. SET
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set channel properties')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Select channel')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
            .setRequired(true)
        )
        .addStringOption((opt) => opt.setName('name').setDescription('New name'))
        .addStringOption((opt) => opt.setName('topic').setDescription('New topic'))
    )
    // 6. MOVE
    .addSubcommand((sub) =>
      sub
        .setName('move')
        .setDescription('Change channel position')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Select channel')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
            .setRequired(true)
        )
        .addIntegerOption((opt) => opt.setName('position').setDescription('Target position').setRequired(true))
    )
    // 7. CLONE
    .addSubcommand((sub) =>
      sub
        .setName('clone')
        .setDescription('Clone a channel with its settings and permissions')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Channel to clone')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
            .setRequired(true)
        )
        .addStringOption((opt) => opt.setName('name').setDescription('New cloned channel name'))
    )
    // 8. CATEGORY
    .addSubcommand((sub) =>
      sub
        .setName('category')
        .setDescription('Move channel into a category')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Channel to move')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
            .setRequired(true)
        )
        .addChannelOption((opt) =>
          opt
            .setName('parent')
            .setDescription('Target category')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
    )
    // 9. SLOWMODE
    .addSubcommand((sub) =>
      sub
        .setName('slowmode')
        .setDescription('Configure slowmode for a text channel')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Select channel')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName('seconds')
            .setDescription('Slowmode delay in seconds (0 to disable)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(21600)
        )
    )
    // 10. LOCK
    .addSubcommand((sub) =>
      sub
        .setName('lock')
        .setDescription('Lock a channel to restrict messages')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Select channel')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
            .setRequired(true)
        )
        .addStringOption((opt) => opt.setName('reason').setDescription('Reason for locking'))
    )
    // 11. UNLOCK
    .addSubcommand((sub) =>
      sub
        .setName('unlock')
        .setDescription('Unlock a channel to restore standard permissions')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Select channel')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
            .setRequired(true)
        )
    )
    // 12. MENU
    .addSubcommand((sub) =>
      sub
        .setName('menu')
        .setDescription('Open interactive dropdown channel management menu')
    ),

  async execute(interaction) {
    if (!hasManageChannels(interaction.member)) {
      return interaction.reply({
        embeds: [createPermissionErrorEmbed('user', ['Manage Channels'])],
        ephemeral: true,
      });
    }

    const botCheck = checkBotPermissions(interaction.guild, [PermissionFlagsBits.ManageChannels]);
    if (!botCheck.hasPermission) {
      return interaction.reply({
        embeds: [createPermissionErrorEmbed('bot', botCheck.missing)],
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    // 1. CREATE
    if (subcommand === 'create') {
      const name = interaction.options.getString('name');
      const type = interaction.options.getInteger('type');
      const category = interaction.options.getChannel('category');
      const topic = interaction.options.getString('topic');
      const slowmode = interaction.options.getInteger('slowmode');
      const nsfw = interaction.options.getBoolean('nsfw');

      await interaction.deferReply({ ephemeral: true });

      try {
        const createOptions = {
          name,
          type,
          parent: category ? category.id : undefined,
          topic: topic || undefined,
          rateLimitPerUser: slowmode !== null ? slowmode : undefined,
          nsfw: nsfw || false,
        };

        const channel = await interaction.guild.channels.create(createOptions);

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CHANNEL_CREATE',
          targetId: channel.id,
          targetName: channel.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: { type, parent: category?.name, topic },
          client: interaction.client,
        });

        const embed = new EmbedBuilder()
          .setColor('#23a55a')
          .setTitle('✅ Channel Created')
          .setDescription(`Successfully created <#${channel.id}>`)
          .addFields(
            { name: 'Name', value: channel.name, inline: true },
            { name: 'Type', value: `${ChannelType[channel.type]}`, inline: true },
            { name: 'Category', value: category ? category.name : 'None', inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ content: `❌ Failed to create channel: ${err.message}` });
      }
    }

    // 2. DELETE
    if (subcommand === 'delete') {
      const channel = interaction.options.getChannel('channel');

      const { embed, row } = createConfirmationPrompt({
        title: 'Delete Channel Confirmation',
        description: `Are you sure you want to permanently delete <#${channel.id}> (\`${channel.name}\`)?\n` +
          'All messages and attachments in this channel will be deleted permanently.',
        confirmCustomId: `confirm_chan_del:${channel.id}`,
        cancelCustomId: 'cancel_action',
        confirmLabel: 'Delete Channel',
      });

      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
    }

    // 3. EDIT & SET
    if (subcommand === 'edit' || subcommand === 'set') {
      const channel = interaction.options.getChannel('channel');
      const newName = interaction.options.getString('name');
      const newTopic = interaction.options.getString('topic');
      const newSlowmode = interaction.options.getInteger('slowmode');

      if (!newName && !newTopic && newSlowmode === null) {
        return interaction.reply({
          content: '⚠️ Please provide at least one parameter to update (name, topic, or slowmode).',
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const editData = {};
        if (newName) editData.name = newName;
        if (newTopic !== null) editData.topic = newTopic;
        if (newSlowmode !== null) editData.rateLimitPerUser = newSlowmode;

        await channel.edit(editData);

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CHANNEL_EDIT',
          targetId: channel.id,
          targetName: channel.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: editData,
          client: interaction.client,
        });

        const embed = new EmbedBuilder()
          .setColor('#23a55a')
          .setTitle('✅ Channel Updated')
          .setDescription(`Channel <#${channel.id}> has been updated.`)
          .addFields(
            { name: 'Name', value: channel.name, inline: true },
            { name: 'Slowmode', value: `${channel.rateLimitPerUser || 0}s`, inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ content: `❌ Failed to edit channel: ${err.message}` });
      }
    }

    // 4. LIST
    if (subcommand === 'list') {
      const categoryFilter = interaction.options.getChannel('category');
      let channels = interaction.guild.channels.cache.filter((c) => c.type !== ChannelType.GuildCategory);

      if (categoryFilter) {
        channels = channels.filter((c) => c.parentId === categoryFilter.id);
      }

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(
          categoryFilter
            ? `Channels in Category: ${categoryFilter.name} (${channels.size})`
            : `Server Channels (${channels.size})`
        )
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setTimestamp();

      const lines = channels
        .map((c) => {
          const typeIcon = c.type === ChannelType.GuildVoice ? '🔊' : c.type === ChannelType.GuildAnnouncement ? '📢' : '#';
          const parent = c.parent ? `[${c.parent.name}]` : '[Uncategorized]';
          return `${typeIcon} <#${c.id}> (\`${c.id}\`) ${parent}`;
        })
        .slice(0, 30);

      embed.setDescription(lines.join('\n') || 'No channels found.');

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 5. MOVE
    if (subcommand === 'move') {
      const channel = interaction.options.getChannel('channel');
      const position = interaction.options.getInteger('position');

      await interaction.deferReply({ ephemeral: true });

      try {
        await channel.setPosition(position);

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CHANNEL_MOVE',
          targetId: channel.id,
          targetName: channel.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: { position },
          client: interaction.client,
        });

        return interaction.editReply({
          content: `✅ Channel <#${channel.id}> position updated to **${position}**.`,
        });
      } catch (err) {
        return interaction.editReply({ content: `❌ Failed to move channel: ${err.message}` });
      }
    }

    // 6. CLONE
    if (subcommand === 'clone') {
      const channel = interaction.options.getChannel('channel');
      const customName = interaction.options.getString('name');

      await interaction.deferReply({ ephemeral: true });

      try {
        const cloned = await channel.clone({
          name: customName || `${channel.name}-copy`,
        });

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CHANNEL_CLONE',
          targetId: cloned.id,
          targetName: cloned.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: { sourceChannel: channel.name, sourceId: channel.id },
          client: interaction.client,
        });

        const embed = new EmbedBuilder()
          .setColor('#23a55a')
          .setTitle('✅ Channel Cloned')
          .setDescription(`Successfully cloned <#${channel.id}> to <#${cloned.id}> with preserved permissions.`)
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ content: `❌ Failed to clone channel: ${err.message}` });
      }
    }

    // 7. CATEGORY
    if (subcommand === 'category') {
      const channel = interaction.options.getChannel('channel');
      const parent = interaction.options.getChannel('parent');

      await interaction.deferReply({ ephemeral: true });

      try {
        await channel.setParent(parent.id, { lockPermissions: false });

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CHANNEL_MOVE_CATEGORY',
          targetId: channel.id,
          targetName: channel.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: { targetCategory: parent.name, targetCategoryId: parent.id },
          client: interaction.client,
        });

        return interaction.editReply({
          content: `✅ Moved <#${channel.id}> to category **${parent.name}**.`,
        });
      } catch (err) {
        return interaction.editReply({ content: `❌ Failed to move channel to category: ${err.message}` });
      }
    }

    // 8. SLOWMODE
    if (subcommand === 'slowmode') {
      const channel = interaction.options.getChannel('channel');
      const seconds = interaction.options.getInteger('seconds');

      await interaction.deferReply({ ephemeral: true });

      try {
        await channel.setRateLimitPerUser(seconds);

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CHANNEL_SLOWMODE',
          targetId: channel.id,
          targetName: channel.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: { slowmodeSeconds: seconds },
          client: interaction.client,
        });

        return interaction.editReply({
          content: seconds === 0
            ? `✅ Slowmode disabled for <#${channel.id}>.`
            : `✅ Slowmode for <#${channel.id}> set to **${seconds}** seconds.`,
        });
      } catch (err) {
        return interaction.editReply({ content: `❌ Failed to configure slowmode: ${err.message}` });
      }
    }

    // 9. LOCK
    if (subcommand === 'lock') {
      const channel = interaction.options.getChannel('channel');
      const reason = interaction.options.getString('reason') || 'Channel locked by Administrator';

      await interaction.deferReply({ ephemeral: true });

      try {
        if (channel.isTextBased()) {
          await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false,
            AddReactions: false,
            CreatePublicThreads: false,
          }, { reason });
        } else if (channel.isVoiceBased()) {
          await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            Connect: false,
          }, { reason });
        }

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CHANNEL_LOCK',
          targetId: channel.id,
          targetName: channel.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: { reason },
          client: interaction.client,
        });

        const embed = new EmbedBuilder()
          .setColor('#f23f43')
          .setTitle('🔒 Channel Locked')
          .setDescription(`Channel <#${channel.id}> has been locked.\n**Reason:** ${reason}`)
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ content: `❌ Failed to lock channel: ${err.message}` });
      }
    }

    // 10. UNLOCK
    if (subcommand === 'unlock') {
      const channel = interaction.options.getChannel('channel');

      await interaction.deferReply({ ephemeral: true });

      try {
        if (channel.isTextBased()) {
          await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: null,
            AddReactions: null,
            CreatePublicThreads: null,
          });
        } else if (channel.isVoiceBased()) {
          await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            Connect: null,
          });
        }

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CHANNEL_UNLOCK',
          targetId: channel.id,
          targetName: channel.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: {},
          client: interaction.client,
        });

        const embed = new EmbedBuilder()
          .setColor('#23a55a')
          .setTitle('🔓 Channel Unlocked')
          .setDescription(`Channel <#${channel.id}> has been unlocked. Standard permissions restored.`)
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ content: `❌ Failed to unlock channel: ${err.message}` });
      }
    }

    // 11. MENU (Interactive Channel Panel)
    if (subcommand === 'menu') {
      const channels = interaction.guild.channels.cache
        .filter((c) => c.type !== ChannelType.GuildCategory)
        .first(25);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⚙️ Channel Management Interactive Menu')
        .setDescription('Select a channel below to manage, or click **Create New Channel**.')
        .setFooter({ text: 'Discord Server Manager' });

      const options = channels.map((c) => ({
        label: c.name.slice(0, 100),
        value: c.id,
        description: `${ChannelType[c.type]} | ${c.parent ? c.parent.name : 'Uncategorized'}`,
        emoji: c.type === ChannelType.GuildVoice ? '🔊' : '💬',
      }));

      const components = [];

      if (options.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('menu_channel_select')
          .setPlaceholder('Choose a channel to manage...')
          .addOptions(options);

        components.push(new ActionRowBuilder().addComponents(selectMenu));
      }

      const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_channel_create')
          .setLabel('➕ Create New Channel')
          .setStyle(ButtonStyle.Success)
      );
      components.push(btnRow);

      return interaction.reply({ embeds: [embed], components, ephemeral: true });
    }
  },
};

