const dotenv = require('dotenv');
const path = require('path');

// Load .env from root or local
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to local

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'dev_session_secret_change_in_production_987654',
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    clientSecret: process.env.CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:5000/api/auth/callback',
    guildId: process.env.GUILD_ID || '',
  },
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
};

module.exports = config;

