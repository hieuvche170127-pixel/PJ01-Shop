const { User, Message, Conversation } = require('../models');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Get all conversations for the current user
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate({
      path: 'participants',
      select: 'username fullname avatarURL'
    })
    .populate({
      path: 'lastMessage',
      select: 'content createdAt sender'
    })
    .sort({ updatedAt: -1 });
    
    // Format response to include participant details (excluding current user)
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId
      );
      
      return {
        _id: conv._id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount.get(userId.toString()) || 0,
        updatedAt: conv.updatedAt
      };
    });
    
    return res.status(200).json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
};

/**
 * Get all messages for a specific conversation
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation'
      });
    }
    
    // Get messages paginated
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({
      conversationId
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'sender',
      select: 'username fullname avatarURL'
    });
    
    // Mark messages as read
    await Message.updateMany(
      { 
        conversationId,
        recipient: userId,
        read: false
      },
      { read: true }
    );
    
    // Reset unread count for this user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();
    
    return res.status(200).json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

/**
 * Find or create a conversation with another user
 */
const findOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId } = req.params;
    
    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }
    
    // Find existing conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] }
    })
    .populate({
      path: 'participants',
      select: 'username fullname avatarURL'
    });
    
    if (conversation) {
      return res.status(200).json({
        success: true,
        conversation
      });
    }
    
    // Create new conversation
    const newConversation = await Conversation.create({
      participants: [userId, recipientId],
      unreadCount: new Map([[recipientId, 0], [userId, 0]])
    });
    
    await newConversation.populate({
      path: 'participants',
      select: 'username fullname avatarURL'
    });
    
    return res.status(201).json({
      success: true,
      conversation: newConversation
    });
  } catch (error) {
    logger.error('Error creating conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating conversation'
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  findOrCreateConversation
}; 