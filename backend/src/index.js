const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { errorHandler } = require('./middleware/errorHandler');

// Bot initialization
const { startBot } = require('../../bot/src/index');

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow next.js frontend communication
  })
);

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (100 requests per minute per IP for standard API)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  const discordService = require('./services/discordService');
  const client = discordService.getClient();
  res.json({
    status: 'ok',
    botOnline: client.isReady(),
    botUser: client.user ? client.user.tag : null,
    cachedGuilds: client.guilds.cache.size,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/guilds', require('./routes/guilds'));
app.use('/api/guilds/:guildId/categories', require('./routes/categories'));
app.use('/api/guilds/:guildId/channels', require('./routes/channels'));
app.use('/api/guilds/:guildId/permissions', require('./routes/permissions'));
app.use('/api/guilds/:guildId/audit-logs', require('./routes/auditLogs'));
app.use('/api/guilds/:guildId/settings', require('./routes/settings'));

// Error handling
app.use(errorHandler);

// Start Server and Bot Gateway
const server = app.listen(config.port, () => {
  console.log(`[Backend API] Server running on http://localhost:${config.port}`);
  console.log(`[Backend API] Frontend URL set to: ${config.frontendUrl}`);

  // Auto-start Discord bot gateway client if token exists
  if (config.discord.token) {
    console.log('[Backend API] Starting Discord Bot gateway client...');
    startBot().catch((err) => {
      console.error('[Backend API] Bot failed to start:', err.message);
    });
  } else {
    console.warn('[Backend API] DISCORD_TOKEN is missing. Bot client not started.');
  }
});

module.exports = { app, server };

