const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`[Discord Bot] Ready! Logged in as ${client.user.tag} (${client.user.id})`);
    console.log(`[Discord Bot] Serving ${client.guilds.cache.size} server(s).`);

    client.user.setActivity({
      name: 'Server Channels & Categories | /help',
      type: ActivityType.Custom,
      state: 'Managing channels & categories 🚀',
    });
  },
};

