import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { API_URL } from '../../utils/apiUrl';

// Async thunk for fetching conversations
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.conversations;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

// Async thunk for fetching messages in a conversation
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(
        `${API_URL}/chat/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return {
        conversationId,
        messages: response.data.messages
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

// Async thunk for starting a new conversation
export const startConversation = createAsyncThunk(
  'chat/startConversation',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.post(
        `${API_URL}/chat/conversations/user/${userId}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.conversation;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start conversation');
    }
  }
);

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  loading: false,
  error: null,
  onlineUsers: {},
  typingUsers: {}
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      if (!state.messages[conversationId].some(existing => existing._id === message._id)) state.messages[conversationId].push(message);
      
      // Update the last message of the conversation
      const conversationIndex = state.conversations.findIndex(
        conv => conv._id === conversationId
      );
      
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message;
        
        // Move this conversation to the top
        const conversation = state.conversations[conversationIndex];
        state.conversations.splice(conversationIndex, 1);
        state.conversations.unshift(conversation);
      }
    },
    markMessagesAsRead: (state, action) => {
      const { conversationId, messageIds } = action.payload;
      
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].map(
          message => messageIds.includes(message._id) 
            ? { ...message, read: true } 
            : message
        );
      }
      
      // Update unread count for this conversation
      const conversationIndex = state.conversations.findIndex(
        conv => conv._id === conversationId
      );
      
      if (conversationIndex !== -1 && action.payload.resetUnread !== false) {
        state.conversations[conversationIndex].unreadCount = 0;
      }
    },
    updateOnlineStatus: (state, action) => {
      const { userId, status } = action.payload;
      state.onlineUsers[userId] = status === 'online';
    },
    updateTypingStatus: (state, action) => {
      const { userId, conversationId, isTyping } = action.payload;
      
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = {};
      }
      
      state.typingUsers[conversationId][userId] = isTyping;
    },
    incrementUnreadCount: (state, action) => {
      const { conversationId } = action.payload;
      const conversationIndex = state.conversations.findIndex(
        conv => conv._id === conversationId
      );
      
      if (conversationIndex !== -1) {
        const currentCount = state.conversations[conversationIndex].unreadCount || 0;
        state.conversations[conversationIndex].unreadCount = currentCount + 1;
      }
    },
    clearChatState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.loading = false;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // Handle fetchMessages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload;
        const merged = new Map(messages.map(message => [message._id, message]));
        for (const message of state.messages[conversationId] || []) if (!merged.has(message._id)) merged.set(message._id, message);
        state.messages[conversationId] = [...merged.values()].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
        state.loading = false;
        
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // Handle startConversation
      .addCase(startConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        // Check if conversation already exists
        const existingIndex = state.conversations.findIndex(
          conv => conv._id === action.payload._id
        );
        
        if (existingIndex === -1) {
          state.conversations.unshift(action.payload);
        }
        
        state.activeConversation = action.payload._id;
        state.loading = false;
      })
      .addCase(startConversation.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  }
});

export const {
  setActiveConversation,
  addMessage,
  markMessagesAsRead,
  updateOnlineStatus,
  updateTypingStatus,
  incrementUnreadCount,
  clearChatState
} = chatSlice.actions;

export default chatSlice.reducer; 