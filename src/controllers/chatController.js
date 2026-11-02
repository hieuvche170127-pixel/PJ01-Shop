const { Message, Conversation } = require('../models');
const chat = require('../services/chatService');
const { fail, respondError } = require('../utils/apiError');
exports.getConversations = async (req, res) => {
  try {
    const rows = await Conversation.find({ participants: req.user.id }).sort({ updatedAt: -1 });
    res.json({ success: true, conversations: await Promise.all(rows.map(row => chat.format(row, req.user.id))) });
  } catch (error) { respondError(res, error); }
};
exports.getMessages = async (req, res) => {
  try {
    await chat.member(req.params.conversationId, req.user.id);
    const page = Number(req.query.page || 1), limit = Number(req.query.limit || 20);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) fail(400, 'Invalid pagination');
    const filter = { conversationId: req.params.conversationId };
    const [messages, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).populate('sender', 'username fullname avatarURL'),
      Message.countDocuments(filter)
    ]);
    res.json({ success: true, messages: messages.reverse(), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { respondError(res, error); }
};
exports.findOrCreateConversation = async (req, res) => {
  try { res.json({ success: true, conversation: await chat.start(req.user.id, req.params.recipientId, req.method === 'POST') }); }
  catch (error) { respondError(res, error); }
};
exports.markRead = async (req, res) => {
  try { await chat.read(req.user.id, req.params.conversationId, req.body.messageIds); res.json({ success: true }); }
  catch (error) { respondError(res, error); }
};
