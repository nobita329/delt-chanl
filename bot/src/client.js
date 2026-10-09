const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User],
});

client.commands = new Collection();

module.exports = client;

