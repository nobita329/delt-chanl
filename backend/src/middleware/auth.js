const prisma = require('../config/prisma');

/**
 * Middleware to require valid authenticated user session
 */
async function requireAuth(req, res, next) {
  try {
    const sessionToken = req.cookies?.session_token || req.headers['authorization']?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    req.user = session.user;
    req.sessionId = session.id;
    next();
  } catch (error) {
    console.error('[AuthMiddleware Error]:', error);
    return res.status(500).json({ error: 'Internal authentication error' });
  }
}

module.exports = {
  requireAuth,
};

