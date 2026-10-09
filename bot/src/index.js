const fs = require('fs');
const path = require('path');
const client = require('./client');

function loadBotModules(botClient = client) {
  // Load commands
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      botClient.commands.set(command.data.name, command);
      console.log(`[Bot] Loaded command: /${command.data.name}`);
    }
  }

  // Load events
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      botClient.once(event.name, (...args) => event.execute(...args));
    } else {
      botClient.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`[Bot] Registered event: ${event.name}`);
  }
}

async function startBot(botClient = client) {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.warn('[Bot] No DISCORD_TOKEN provided. Bot gateway login skipped until configured.');
    return;
  }

  loadBotModules(botClient);

  try {
    await botClient.login(token);
  } catch (err) {
    console.error('[Bot Login Error]:', err.message);
  }
}

// If executed directly
if (require.main === module) {
  startBot();
}

module.exports = {
  client,
  loadBotModules,
  startBot,
};

