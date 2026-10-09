const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { hasManageChannels, checkBotPermissions, createPermissionErrorEmbed } = require('../utils/permissions');
const { createConfirmationPrompt } = require('../utils/confirmations');
const { recordAuditLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('category')
    .setDescription('Manage server categories')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a new category')
        .addStringOption((opt) => opt.setName('name').setDescription('Name of the category').setRequired(true))
        .addIntegerOption((opt) => opt.setName('position').setDescription('Order position (optional)'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete a category')
        .addChannelOption((opt) =>
          opt
            .setName('category')
            .setDescription('Select the category to delete')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Rename or update category properties')
        .addChannelOption((opt) =>
          opt
            .setName('category')
            .setDescription('Select category')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addStringOption((opt) => opt.setName('name').setDescription('New category name'))
        .addIntegerOption((opt) => opt.setName('position').setDescription('New position'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Show all server categories and channel counts')
    )
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set category properties')
        .addChannelOption((opt) =>
          opt
            .setName('category')
            .setDescription('Select category')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addStringOption((opt) => opt.setName('name').setDescription('New name'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('move')
        .setDescription('Change category position')
        .addChannelOption((opt) =>
          opt
            .setName('category')
            .setDescription('Select category')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addIntegerOption((opt) => opt.setName('position').setDescription('Target position').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('menu')
        .setDescription('Open interactive dropdown category management panel')
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
      const position = interaction.options.getInteger('position');

      await interaction.deferReply({ ephemeral: true });

      try {
        const category = await interaction.guild.channels.create({
          name,
          type: ChannelType.GuildCategory,
          position: position !== null ? position : undefined,
        });

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CATEGORY_CREATE',
          targetId: category.id,
          targetName: category.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: { position: category.position },
          client: interaction.client,
        });

        const embed = new EmbedBuilder()
          .setColor('#23a55a')
          .setTitle('✅ Category Created')
          .setDescription(`Successfully created category **${category.name}** (\`${category.id}\`)`)
          .addFields({ name: 'Position', value: `${category.position}`, inline: true })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({
          content: `❌ Failed to create category: ${err.message}`,
        });
      }
    }

    // 2. DELETE (With confirmation)
    if (subcommand === 'delete') {
      const category = interaction.options.getChannel('category');
      const childCount = category.children.cache.size;

      const { embed, row } = createConfirmationPrompt({
        title: 'Delete Category & Channels Confirmation',
        description: `Are you sure you want to permanently delete category **${category.name}**?\n` +
          `⚠️ **All ${childCount} channel(s) inside this category will also be permanently deleted!**`,
        confirmCustomId: `confirm_cat_del:${category.id}`,
        cancelCustomId: 'cancel_action',
        confirmLabel: `Delete Category & ${childCount} Channel(s)`,
      });

      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
    }

    // 3. EDIT
    if (subcommand === 'edit' || subcommand === 'set') {
      const category = interaction.options.getChannel('category');
      const newName = interaction.options.getString('name');
      const newPosition = interaction.options.getInteger('position');

      if (!newName && newPosition === null) {
        return interaction.reply({
          content: '⚠️ Please provide a new name or position to update.',
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const updateData = {};
        if (newName) updateData.name = newName;
        if (newPosition !== null) updateData.position = newPosition;

        const oldName = category.name;
        await category.edit(updateData);

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CATEGORY_EDIT',
          targetId: category.id,
          targetName: category.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: { oldName, updateData },
          client: interaction.client,
        });

        const embed = new EmbedBuilder()
          .setColor('#23a55a')
          .setTitle('✅ Category Updated')
          .setDescription(`Category **${category.name}** has been updated successfully.`)
          .addFields(
            { name: 'Name', value: category.name, inline: true },
            { name: 'Position', value: `${category.position}`, inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({
          content: `❌ Failed to edit category: ${err.message}`,
        });
      }
    }

    // 4. MOVE
    if (subcommand === 'move') {
      const category = interaction.options.getChannel('category');
      const position = interaction.options.getInteger('position');

      await interaction.deferReply({ ephemeral: true });

      try {
        await category.setPosition(position);

        await recordAuditLog({
          guildId: interaction.guild.id,
          action: 'CATEGORY_MOVE',
          targetId: category.id,
          targetName: category.name,
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          source: 'DISCORD_BOT',
          details: { newPosition: position },
          client: interaction.client,
        });

        const embed = new EmbedBuilder()
          .setColor('#23a55a')
          .setTitle('✅ Category Moved')
          .setDescription(`Category **${category.name}** position set to **${position}**.`)
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({
          content: `❌ Failed to move category: ${err.message}`,
        });
      }
    }

    // 5. LIST
    if (subcommand === 'list') {
      const categories = interaction.guild.channels.cache
        .filter((c) => c.type === ChannelType.GuildCategory)
        .sort((a, b) => a.position - b.position);

      if (categories.size === 0) {
        return interaction.reply({
          content: 'ℹ️ No categories found in this server.',
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📁 Server Categories (${categories.size})`)
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setTimestamp();

      const fields = categories.map((cat) => {
        const textCount = cat.children.cache.filter((c) => c.type === ChannelType.GuildText).size;
        const voiceCount = cat.children.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
        return {
          name: `📁 ${cat.name} (Pos: ${cat.position})`,
          value: `ID: \`${cat.id}\` | Text: **${textCount}** | Voice: **${voiceCount}** | Total: **${cat.children.cache.size}**`,
          inline: false,
        };
      });

      embed.addFields(fields.slice(0, 25)); // Discord embed field limit

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 6. MENU (Interactive UI)
    if (subcommand === 'menu') {
      const categories = interaction.guild.channels.cache
        .filter((c) => c.type === ChannelType.GuildCategory)
        .sort((a, b) => a.position - b.position);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⚙️ Category Management Interactive Menu')
        .setDescription(
          'Select a category below to perform actions (Edit, Delete, Move, or View Channels), or click Create to make a new one.'
        )
        .setFooter({ text: 'Select an option below' });

      const options = categories.map((c) => ({
        label: c.name.slice(0, 100),
        value: c.id,
        description: `${c.children.cache.size} channels | Position: ${c.position}`,
        emoji: '📁',
      })).slice(0, 25);

      const components = [];

      if (options.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('menu_category_select')
          .setPlaceholder('Choose a category...')
          .addOptions(options);

        components.push(new ActionRowBuilder().addComponents(selectMenu));
      }

      // Add Action Row with Create Category button
      const { ButtonBuilder, ButtonStyle } = require('discord.js');
      const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_category_create')
          .setLabel('➕ Create New Category')
          .setStyle(ButtonStyle.Success)
      );
      components.push(btnRow);

      return interaction.reply({
        embeds: [embed],
        components,
        ephemeral: true,
      });
    }
  },
};

