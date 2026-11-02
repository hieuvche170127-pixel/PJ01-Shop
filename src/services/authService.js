const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

class AuthenticationError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function authenticateToken(token) {
  if (!process.env.JWT_SECRET) throw new AuthenticationError(500, 'Server configuration error');
  if (typeof token !== 'string' || !token) throw new AuthenticationError(401, 'Authentication required');
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { throw new AuthenticationError(401, 'Invalid or expired token'); }
  if (!decoded || !mongoose.isObjectIdOrHexString(decoded.id)) throw new AuthenticationError(401, 'Invalid token');
  const user = await User.findById(decoded.id).select('_id username role action tokenVersion').lean();
  if (!user) throw new AuthenticationError(401, 'Account no longer exists');
  if ((decoded.ver || 0) !== (user.tokenVersion || 0)) throw new AuthenticationError(401, 'Session expired; sign in again');
  if (user.action === 'lock') throw new AuthenticationError(403, 'Account is locked');
  // Current database role is authoritative, not the role saved in an old JWT.
  return { id: user._id.toString(), username: user.username, role: user.role };
}

function disconnectUserSockets(io, userId) {
  if (!io?.sockets?.sockets) return;
  for (const socket of io.sockets.sockets.values()) {
    if (socket.user?.id === String(userId)) socket.disconnect(true);
  }
}

module.exports = { authenticateToken, AuthenticationError, disconnectUserSockets };
