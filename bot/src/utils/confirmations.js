const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

/**
 * Builds a confirmation embed and button action row
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} options.confirmCustomId
 * @param {string} options.cancelCustomId
 * @param {string} [options.confirmLabel='Confirm']
 * @param {string} [options.cancelLabel='Cancel']
 * @param {ButtonStyle} [options.confirmStyle=ButtonStyle.Danger]
 */
function createConfirmationPrompt({
  title = 'Confirmation Required',
  description,
  confirmCustomId,
  cancelCustomId = 'cancel_action',
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  confirmStyle = ButtonStyle.Danger,
}) {
  const embed = new EmbedBuilder()
    .setColor('#f0b232')
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setFooter({ text: 'This action cannot be undone.' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(confirmCustomId)
      .setLabel(confirmLabel)
      .setStyle(confirmStyle),
    new ButtonBuilder()
      .setCustomId(cancelCustomId)
      .setLabel(cancelLabel)
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, row };
}

module.exports = {
  createConfirmationPrompt,
};

