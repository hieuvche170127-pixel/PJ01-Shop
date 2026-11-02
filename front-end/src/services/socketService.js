import { io } from 'socket.io-client';
import { API_ORIGIN } from '../utils/apiUrl';
import { markMessagesAsRead, fetchConversations, clearChatState } from '../features/chat/chatSlice';
import store from '../redux/store';
import {
  addMessage,
  updateOnlineStatus,
  updateTypingStatus,
  incrementUnreadCount
} from '../features/chat/chatSlice';

let socket;
let currentAuthToken = store.store.getState().auth.token;
store.store.subscribe(() => {
  const nextToken = store.store.getState().auth.token;
  if (nextToken === currentAuthToken) return;
  currentAuthToken = nextToken;
  if (socket) { socket.disconnect(); socket = null; }
  store.store.dispatch(clearChatState());
});

export const initSocketConnection = () => {
  try {
    const state = store.store.getState();
    const token = state.auth.token;
    
    if (!token) {
      console.warn('No authentication token found. Socket connection aborted.');
      return null;
    }
    
    if (socket && socket.auth.token === token) return socket;
    if (socket) socket.disconnect();
    const API_URL = API_ORIGIN;
    
    // Initialize the socket connection
    socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    // Setup event listeners
    socket.on('connect', () => {
      console.log('Connected to chat server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
    
    socket.on('newMessage', (message) => {
      const state = store.store.getState();
      const activeConversation = state.chat.activeConversation;
      
      store.store.dispatch(addMessage({
        conversationId: message.conversationId,
        message
      }));
      
      // If not the active conversation, increment unread count
      if (!state.chat.conversations.some(c => c._id === message.conversationId)) store.store.dispatch(fetchConversations());
      if (activeConversation !== message.conversationId && String(message.recipient) === String(state.auth.user?.id || state.auth.user?._id)) {
        store.store.dispatch(incrementUnreadCount({
          conversationId: message.conversationId
        }));
      }
    });
    
    socket.on('userStatus', ({ userId, status }) => {
      store.store.dispatch(updateOnlineStatus({ userId, status }));
    });
    
    socket.on('userTyping', ({ userId, isTyping, conversationId }) => {
      store.store.dispatch(updateTypingStatus({
        userId,
        conversationId,
        isTyping
      }));
    });
    
    socket.on('messagesRead', ({ reader, messageIds, conversationId }) => {
      store.store.dispatch(markMessagesAsRead({ conversationId, messageIds, resetUnread: String(reader) === String(store.store.getState().auth.user?.id || store.store.getState().auth.user?._id) }));
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });
    
    return socket;
  } catch (error) {
    console.error('Error initializing socket connection:', error);
    return null;
  }
};

export const joinConversation = (conversationId) => {
  if (!conversationId || !socket) return;
  
  try {
    socket.emit('joinConversation', conversationId);
  } catch (error) {
    console.error('Error joining conversation:', error);
  }
};

export const leaveConversation = (conversationId) => {
  if (!conversationId || !socket) return;
  
  try {
    socket.emit('leaveConversation', conversationId);
  } catch (error) {
    console.error('Error leaving conversation:', error);
  }
};

export const sendMessage = messageData => new Promise((resolve, reject) => {
  const current = initSocketConnection();
  if (!current) return reject(new Error('Hãy đăng nhập để gửi tin nhắn'));
  current.timeout(10000).emit('sendMessage', messageData, (error, result) => {
    if (error || !result?.success) return reject(new Error(result?.message || 'Chưa xác nhận gửi tin nhắn; kiểm tra cuộc trò chuyện trước khi gửi lại'));
    resolve(result.data);
  });
});

export const markAsRead = (conversationId, messageIds) => {
  if (!conversationId || !messageIds || !socket || !socket.connected) return;
  
  try {
    socket.emit('markAsRead', { conversationId, messageIds });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

export const sendTypingStatus = (conversationId, isTyping) => {
  if (!conversationId || !socket) return;
  
  try {
    socket.emit('typing', { conversationId, isTyping });
  } catch (error) {
    console.error('Error sending typing status:', error);
  }
};

export const disconnectSocket = () => {
  if (!socket) return;
  
  try {
    socket.disconnect();
    socket = null;
  } catch (error) {
    console.error('Error disconnecting socket:', error);
  }
}; 