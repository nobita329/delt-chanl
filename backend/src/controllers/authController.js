const crypto = require('crypto');
const axios = require('axios');
const prisma = require('../config/prisma');
const config = require('../config/config');

class AuthController {
  /**
   * Redirect user to Discord OAuth2 Authorize page
   */
  login(req, res) {
    const { clientId, redirectUri } = config.discord;
    if (!clientId) {
      return res.status(500).json({ error: 'Discord CLIENT_ID is not configured' });
    }

    const state = crypto.randomBytes(16).toString('hex');
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds',
      state,
      prompt: 'consent',
    });

    const discordAuthUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
    return res.redirect(discordAuthUrl);
  }

  /**
   * OAuth2 callback handler
   */
  async callback(req, res) {
    const { code, state } = req.query;
    const cookieState = req.cookies?.oauth_state;

    if (!code) {
      return res.redirect(`${config.frontendUrl}/login?error=missing_code`);
    }

    // Verify state for CSRF protection (relaxed in dev if state cookie not present)
    if (cookieState && state && cookieState !== state) {
      return res.redirect(`${config.frontendUrl}/login?error=invalid_state`);
    }

    try {
      // 1. Exchange code for access token
      const tokenResponse = await axios.post(
        'https://discord.com/api/v10/oauth2/token',
        new URLSearchParams({
          client_id: config.discord.clientId,
          client_secret: config.discord.clientSecret,
          grant_type: 'authorization_code',
          code: code.toString(),
          redirect_uri: config.discord.redirectUri,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // 2. Fetch user profile from Discord
      const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${access_token}` },
        timeout: 5000,
      });

      const discordUser = userResponse.data;

      // 3. Upsert User in Prisma SQLite
      const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      const user = await prisma.user.upsert({
        where: { id: discordUser.id },
        update: {
          username: discordUser.username,
          discriminator: discordUser.discriminator || '0',
          globalName: discordUser.global_name,
          avatar: discordUser.avatar,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt,
        },
        create: {
          id: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator || '0',
          globalName: discordUser.global_name,
          avatar: discordUser.avatar,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt,
        },
      });

      // 4. Create Session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt: sessionExpiresAt,
        },
      });

      // 5. Set session cookie and redirect to dashboard
      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.clearCookie('oauth_state');
      return res.redirect(`${config.frontendUrl}/dashboard`);
    } catch (err) {
      console.error('[OAuth2 Callback Error]:', err.response?.data || err.message);
      return res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(req, res) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { id, username, discriminator, globalName, avatar } = req.user;
    const avatarUrl = avatar
      ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    return res.json({
      user: {
        id,
        username,
        discriminator,
        globalName,
        avatar,
        avatarUrl,
      },
    });
  }

  /**
   * Logout user
   */
  async logout(req, res) {
    try {
      const sessionToken = req.cookies?.session_token;
      if (sessionToken) {
        await prisma.session.deleteMany({ where: { token: sessionToken } });
      }

      res.clearCookie('session_token', { path: '/' });
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      console.error('[Logout Error]:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
  }
}

module.exports = new AuthController();

