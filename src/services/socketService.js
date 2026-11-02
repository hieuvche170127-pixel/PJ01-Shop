const socketIO = require('socket.io');
const { authenticateToken } = require('./authService');
const chat = require('./chatService');
const logger = require('../utils/logger');
const initSocketServer = server => {
  const origins = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', process.env.CLIENT_URL].filter(Boolean);
  const io = socketIO(server, {
    cors: { origin: origins, credentials: true },
    allowRequest: (req, callback) => callback(null, require('../config/corsPolicy').isAllowed(req.headers.origin))
  });
  io.use(async (socket, next) => {
    try { socket.user = await authenticateToken(socket.handshake.auth?.token); next(); }
    catch { next(new Error('Authentication error: Invalid token')); }
  });
  io.on('connection', socket => {
    const userId = socket.user.id;
    socket.join('user:' + userId);
    socket.use(async (packet, next) => {
      try { socket.user = await authenticateToken(socket.handshake.auth?.token); next(); }
      catch { socket.emit('authError', { message: 'Session is no longer authorized' }); socket.disconnect(true); }
    });
    const handle = (event, handler) => socket.on(event, async (data, ack) => {
      try { const result = await handler(data); if (typeof ack === 'function') ack({ success: true, data: result }); }
      catch (error) {
        if (!error.status) logger.error('Chat operation failed', error);
        const result = { success: false, status: error.status || 500, message: error.status ? error.message : 'Chat operation failed' };
        if (typeof ack === 'function') ack(result);
        socket.emit('messageError', result);
      }
    });
    handle('joinConversation', async id => { await chat.member(id, userId); await socket.join('conversation:' + id); });
    handle('leaveConversation', async id => { await chat.member(id, userId); await socket.leave('conversation:' + id); });
    handle('sendMessage', async data => {
      const message = await chat.send(userId, data);
      io.to('user:' + userId).to('user:' + message.recipient).emit('newMessage', message);
      return message;
    });
    handle('markAsRead', async data => {
      const result = await chat.read(userId, data?.conversationId, data?.messageIds);
      result.conversation.participants.forEach(id => io.to('user:' + id).emit('messagesRead', { reader: userId, conversationId: data.conversationId, messageIds: result.messageIds }));
    });
    handle('typing', async data => {
      const conversation = await chat.member(data?.conversationId, userId);
      if (typeof data.isTyping !== 'boolean') return;
      conversation.participants.filter(id => String(id) !== userId).forEach(id => io.to('user:' + id).emit('userTyping', { userId, conversationId: data.conversationId, isTyping: data.isTyping }));
    });
  });
  return io;
};
module.exports = { initSocketServer };
