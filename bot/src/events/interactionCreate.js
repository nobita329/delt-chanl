const { Events } = require('discord.js');
const { handleButtonInteraction } = require('../handlers/buttonHandler');
const { handleSelectMenuInteraction } = require('../handlers/selectHandler');
const { handleModalSubmission } = require('../handlers/modalHandler');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      // 1. Chat Input Slash Commands
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
          console.warn(`[Bot] Unknown command received: ${interaction.commandName}`);
          return;
        }

        try {
          await command.execute(interaction);
        } catch (error) {
          console.error(`[Bot Error in /${interaction.commandName}]:`, error);
          const replyContent = {
            content: `❌ There was an error while executing this command: ${error.message}`,
            ephemeral: true,
          };
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyContent).catch(() => {});
          } else {
            await interaction.reply(replyContent).catch(() => {});
          }
        }
        return;
      }

      // 2. Buttons
      if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
        return;
      }

      // 3. String Select Menus
      if (interaction.isStringSelectMenu()) {
        await handleSelectMenuInteraction(interaction);
        return;
      }

      // 4. Modal Submissions
      if (interaction.isModalSubmit()) {
        await handleModalSubmission(interaction);
        return;
      }
    } catch (err) {
      console.error('[Bot interactionCreate Uncaught Error]:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An unexpected error occurred while processing this interaction.',
          ephemeral: true,
        }).catch(() => {});
      }
    }
  },
};

