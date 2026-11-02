const { User, Message, Conversation } = require('../models');
const { requireId, fail } = require('../utils/apiError');

async function member(id, userId) {
  requireId(id);
  const conversation = await Conversation.findOne({ _id: id, participants: userId });
  if (!conversation) fail(404, 'Conversation not found');
  return conversation;
}
async function format(conversation, userId) {
  await conversation.populate('participants', 'username fullname avatarURL');
  await conversation.populate('lastMessage', 'content image createdAt sender');
  return {
    _id: conversation._id,
    participant: conversation.participants.find(p => String(p._id) !== String(userId)),
    lastMessage: conversation.lastMessage,
    unreadCount: await Message.countDocuments({ conversationId: String(conversation._id), recipient: userId, read: false }),
    updatedAt: conversation.updatedAt
  };
}
async function start(userId, recipientId, create = true) {
  requireId(recipientId);
  if (String(userId) === recipientId) fail(400, 'Cannot chat with yourself');
  if (!await User.exists({ _id: recipientId, action: { $ne: 'lock' } })) fail(404, 'Recipient not found');
  let conversation = await Conversation.findOne({ participants: { $all: [userId, recipientId], $size: 2 } });
  if (!conversation && !create) fail(404, 'Conversation not found');
  if (!conversation) {
    const pairKey = [String(userId), recipientId].sort().join(':');
    try {
      conversation = await Conversation.findOneAndUpdate({ pairKey }, { $setOnInsert: { pairKey, participants: [userId, recipientId] } }, { upsert: true, new: true, runValidators: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
      conversation = await Conversation.findOne({ pairKey });
    }
  }
  return format(conversation, userId);
}
async function send(userId, data) {
  if (!data || typeof data !== 'object') fail(400, 'Invalid message');
  const conversation = await member(data.conversationId, userId);
  if (conversation.participants.length !== 2) fail(409, 'Unsupported conversation');
  const recipientId = String(conversation.participants.find(id => String(id) !== String(userId)));
  if (data.recipientId && data.recipientId !== recipientId) fail(400, 'Recipient does not belong to conversation');
  if (!await User.exists({ _id: recipientId, action: { $ne: 'lock' } })) fail(409, 'Recipient is unavailable');
  if (data.content !== undefined && typeof data.content !== 'string') fail(400, 'Invalid content');
  const content = (data.content || '').trim();
  if (content.length > 4000) fail(400, 'Message is too long');
  let image;
  if (data.image) {
    const Asset = require('../models/UploadedAsset');
    const asset = typeof data.image.public_id === 'string' && await Asset.findOne({ publicId: data.image.public_id, ownerId: userId, state: 'active' });
    if (!asset) fail(400, 'Upload your image before sending it');
    image = { public_id: asset.publicId, url: asset.url, secure_url: asset.url };
  }
  if (!content && !image) fail(400, 'Message is empty');
  const message = await Message.create({ sender: userId, recipient: recipientId, conversationId: String(conversation._id), content, image });
  await Conversation.updateOne({ _id: conversation._id }, { $set: { lastMessage: message._id }, $inc: { [`unreadCount.${recipientId}`]: 1 } });
  await message.populate('sender', 'username fullname avatarURL');
  return message;
}
async function read(userId, conversationId, ids) {
  const conversation = await member(conversationId, userId);
  if (!Array.isArray(ids) || ids.length > 100) fail(400, 'Provide up to 100 message IDs');
  ids.forEach(requireId);
  const unique = [...new Set(ids)];
  const filter = { _id: { $in: unique }, conversationId, recipient: userId };
  if (await Message.countDocuments(filter) !== unique.length) fail(400, 'Messages do not belong to this conversation and recipient');
  await Message.updateMany(filter, { $set: { read: true } });
  // API counts unread messages from their source records; this cache is advisory.
  const remaining = await Message.countDocuments({ conversationId, recipient: userId, read: false });
  await Conversation.updateOne({ _id: conversationId }, { $set: { [`unreadCount.${userId}`]: remaining } });
  return { conversation, messageIds: unique };
}
module.exports = { member, format, start, send, read };
