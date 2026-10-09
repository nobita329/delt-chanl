# 🛡️ Discord Server Manager — Full Web Panel & Bot Suite

A complete, production-ready Discord Server, Category, and Channel Management Web Panel with full discord.js v14 bot integration, Discord OAuth2 authentication, and persistent SQLite database with Prisma ORM.

---

## 🌟 Key Features

### 📁 Category Management
- **Create**: Add new categories with customizable display positions.
- **Edit & Rename**: Update category names and orders on the fly.
- **Inspect**: View all text, voice, announcement, and forum channels nested inside.
- **Delete Confirmation**: Prevent accidental loss with interactive confirmation modals.
- **Direct Channel Creation**: Add channels directly into a category with one click.

### 💬 Channel Management
- **Supported Channel Types**: Text (`GuildText`), Voice (`GuildVoice`), Announcements (`GuildAnnouncement`), and Forums (`GuildForum`).
- **Real-time Lockdown**: Toggle `@everyone` permission overwrites (`SendMessages: false` / `Connect: false`) instantly to stop raids.
- **Channel Cloning**: Duplicate channel configurations, topic, and permission overwrites seamlessly.
- **Audio & Limits**: Configure voice bitrate (64k to 384k) and user limits (0–99).
- **Slowmode & NSFW**: Configure slowmode delays (5s to 6h) and age-restricted flags.
- **Permission Overwrites**: Configure Allow/Neutral/Deny permissions for server roles.

### 🤖 Discord Bot & Slash Commands
- `/category create`, `/category edit`, `/category delete`, `/category list`, `/category move`, `/category menu`
- `/channel create`, `/channel edit`, `/channel delete`, `/channel clone`, `/channel lock`, `/channel unlock`, `/channel slowmode`, `/channel menu`
- `/server info`, `/server channels`
- `/setup` (Configure server audit log channel and manager role)
- `/logs` (Query recent activity records from persistent SQLite)
- `/help` (Interactive guide and web panel link)
- **Interactive Select Menus & Modals**: Manage channels and categories right within Discord using dropdown menus and native modal popups.

### 🔒 Security & Persistence
- **Discord OAuth2 Code Flow**: Secure session cookie with CSRF state verification.
- **Server Permission Enforcement**: Strictly checks `MANAGE_GUILD` or `ADMINISTRATOR` on the backend for every request.
- **Bot Permission Verification**: Validates bot has `Manage Channels` and `Manage Roles` before applying changes.
- **Audit Logging**: Every action across bot and web panel is saved to SQLite via Prisma with executor ID, action type, target ID, and timestamp.

---

## 🏗️ Project Architecture

```
/workspaces/vm/bot/
├── backend/                  # Express REST API & Discord Gateway Client
│   ├── src/
│   │   ├── config/           # Environment & Prisma client singleton
│   │   ├── controllers/      # Auth, Guild, Category, Channel, Permission, Logs
│   │   ├── middleware/       # OAuth2 Session & Guild Permission validators
│   │   ├── routes/           # API Endpoints (/api/auth, /api/guilds/...)
│   │   ├── services/         # discord.js service manipulating guilds
│   │   └── index.js          # Express server entrypoint
│   └── package.json
├── bot/                      # Discord.js v14 Bot & Slash Commands
│   ├── src/
│   │   ├── commands/         # /category, /channel, /server, /setup, /logs, /help
│   │   ├── events/           # ready, interactionCreate
│   │   ├── handlers/         # Button, SelectMenu, and Modal dispatchers
│   │   ├── utils/            # Permissions, Confirmations, Audit Logger
│   │   ├── client.js         # Discord Client instance with GatewayIntents
│   │   ├── deploy-commands.js# Slash command REST deployment script
│   │   └── index.js          # Standalone bot entrypoint
│   └── package.json
├── frontend/                 # Next.js 14 Web Panel (React, TypeScript, Tailwind)
│   ├── app/
│   │   ├── dashboard/        # Overview, Servers, Categories, Channels, Logs
│   │   ├── login/            # Discord login portal
│   │   ├── layout.tsx
│   │   └── page.tsx          # Landing page
│   ├── components/           # Navbar, Sidebar, Modals, ConfirmDialog, Toasts
│   ├── lib/                  # Typed API Client & interfaces
│   └── package.json
├── prisma/
│   └── schema.prisma         # SQLite models: User, Session, GuildSetting, AuditLog
├── .env.example
├── ecosystem.config.js       # PM2 VPS deployment configuration
├── nginx.conf                # Nginx reverse proxy configuration
├── package.json              # Root npm workspace orchestrator
└── README.md
```

---

## 🚀 Setup & Installation (Step-by-Step)

### Step 1: Create Discord Bot & Application
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and enter a name (e.g. `Server Manager`).
3. Under **Bot**:
   - Click **Add Bot** (or Reset Token to copy your bot token).
   - Under **Privileged Gateway Intents**, enable:
     - ✅ **Server Members Intent**
     - ✅ **Message Content Intent**
4. Under **OAuth2**:
   - Copy the **Client ID** and **Client Secret**.
   - Under **Redirects**, add:
     - Development: `http://localhost:5000/api/auth/callback`
     - Production: `https://your-domain.com/api/auth/callback`

### Step 2: Invite the Bot to Your Server
Generate an invite link with Administrator or Manage Channels permissions:
```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```
Fill in the values in `.env`:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_discord_application_client_id
CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:5000/api/auth/callback

PORT=5000
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
SESSION_SECRET=your_random_32_char_secret_key
DATABASE_URL="file:./dev.db"
```

### Step 4: Install Dependencies & Setup Database
From the root directory:
```bash
npm install
npm run prisma:push
```

### Step 5: Deploy Slash Commands to Discord
Register slash commands with the Discord API:
```bash
npm run deploy:commands
```
*(Tip: Set `GUILD_ID=your_test_guild_id` in `.env` for instant guild registration during development).*

### Step 6: Run in Development
Start both the Backend API (which connects the Discord Bot) and the Next.js Frontend concurrently:
```bash
npm run dev
```
- Web Panel: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)

---

## 🌐 Production VPS Deployment (Ubuntu + PM2 + Nginx)

### 1. Build Frontend & Generate Database
```bash
npm run build
```

### 2. Start Services with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Useful PM2 commands:
```bash
pm2 status                  # Check process status
pm2 logs                    # Live log stream
pm2 restart all             # Restart services
pm2 stop all                # Stop services
```

### 3. Setup Nginx Reverse Proxy
1. Copy `nginx.conf` to `/etc/nginx/sites-available/discord-manager`:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/discord-manager
   ```
2. Replace `your-domain.com` with your real domain name in the file.
3. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/discord-manager /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
4. Obtain a free SSL Certificate with Let's Encrypt Certbot:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

---

## 🛠️ Verification & Testing Checklist

- [x] **OAuth2 Authentication**: Log in via Discord, redirect back with secure session cookie, and view manageable servers.
- [x] **Permissions Guard**: Endpoints deny access to non-members or users without `MANAGE_GUILD`/`ADMINISTRATOR`.
- [x] **Category Management**: Create, edit, list, and delete categories from Web Panel and `/category` slash commands.
- [x] **Channel Management**: Create text/voice/announcement/forum channels, edit topic/slowmode, clone, and delete channels.
- [x] **Lock & Unlock**: Instantly toggle channel lock permissions on text and voice channels.
- [x] **Interactive Discord Components**: Buttons for delete confirmation, Select Menus for quick actions, and Modals for renaming.
- [x] **Audit Trail**: Every change is stored in SQLite and dispatched as an embed to the configured server log channel.

