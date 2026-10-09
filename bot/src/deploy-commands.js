const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
  process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    let data;
    if (guildId) {
      console.log(`Registering commands to Guild: ${guildId}`);
      data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log(`Successfully reloaded ${data.length} guild application (/) commands.`);
    } else {
      console.log('Registering commands globally (may take up to 1 hour to propagate across Discord)...');
      data = await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
      console.log(`Successfully reloaded ${data.length} global application (/) commands.`);
    }
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
    process.exit(1);
  }
})();

