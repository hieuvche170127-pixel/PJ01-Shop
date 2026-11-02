import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaPlus, FaArrowLeft } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

import ConversationList from '../../components/chat-component/ConversationList';
import MessageList from '../../components/chat-component/MessageList';
import MessageInput from '../../components/chat-component/MessageInput';
import UserSearch from '../../components/chat-component/UserSearch';

import {
  fetchConversations,
  fetchMessages,
  setActiveConversation,
  startConversation
} from '../../features/chat/chatSlice';

import {
  initSocketConnection,
  joinConversation,
  leaveConversation,
  sendMessage as socketSendMessage,
  sendTypingStatus,
  markAsRead
} from '../../services/socketService';

const Chat = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { conversations, activeConversation, messages, loading } = useSelector(state => state.chat);
  const user = useSelector(state => state.auth.user);
  
  const [showNewChat, setShowNewChat] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  
  // Check if we're on mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Connect to socket on component mount
  useEffect(() => {
    const newSocket = initSocketConnection();
    setSocket(newSocket);
    
    // Fetch all conversations
    dispatch(fetchConversations());
    

  }, [dispatch]);
  
  // Handle initial conversation selection
  useEffect(() => {
    if (location.state?.conversationId) {
      dispatch(setActiveConversation(location.state.conversationId));
    }
  }, [location.state, dispatch]);
  
  // Join conversation room when active conversation changes
  useEffect(() => {
    if (!activeConversation || !socket) return;
    
    // Fetch messages for the active conversation
    dispatch(fetchMessages(activeConversation));
    
    // Join the conversation room
    joinConversation(activeConversation);
    
    // Mobile: Switch to message view
    if (isMobile) {
      setShowConversations(false);
    }
    
    return () => {
      leaveConversation(activeConversation);
    };
  }, [activeConversation, socket, dispatch, isMobile]);
  useEffect(() => {
    if (!activeConversation || !socket) return;
    const ids = (messages[activeConversation] || []).filter(msg => !msg.read && String(msg.recipient) === String(user?.id || user?._id)).map(msg => msg._id);
    if (ids.length) markAsRead(activeConversation, ids.slice(0,100));
  }, [activeConversation, socket, messages, user]);
  
  const handleSelectConversation = (conversationId) => {
    dispatch(setActiveConversation(conversationId));
  };
  
  const handleSendMessage = (content, imageData = null) => {
    if (!activeConversation) return;
    if (!content.trim() && !imageData) return;
    
    // Find the conversation
    const conversation = conversations.find(c => c._id === activeConversation);
    if (!conversation) return;
    
    const messageData = {
      content: content.trim(),
      recipientId: conversation.participant._id,
      conversationId: activeConversation
    };
    
    // Add image data if available
    if (imageData) {
      messageData.image = {
        public_id: imageData.public_id,
        url: imageData.url,
        secure_url: imageData.secure_url
      };
    }
    
    return socketSendMessage(messageData);
  };
  
  const handleTyping = (isTyping) => {
    if (!activeConversation) return;
    sendTypingStatus(activeConversation, isTyping);
  };
  
  const handleSelectUser = (user) => {
    dispatch(startConversation(user._id));
    setShowNewChat(false);
  };
  
  const handleBackToList = () => {
    setShowConversations(true);
  };
  
  return (
    <div className="max-w-6xl mx-auto my-8 h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex h-full">
        {/* Left sidebar - Conversations list */}
        {(!isMobile || showConversations) && (
          <div className="w-full md:w-1/3 h-full border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Messages</h2>
              <button 
                className="p-2 bg-blue-600 text-white rounded-full"
                onClick={() => setShowNewChat(!showNewChat)}
              >
                <FaPlus />
              </button>
            </div>
            
            {/* Search for new users */}
            {showNewChat && (
              <div className="p-4 border-b border-gray-200">
                <UserSearch onSelectUser={handleSelectUser} />
              </div>
            )}
            
            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {loading && !conversations.length ? (
                <div className="p-4 text-center text-gray-500">
                  Loading conversations...
                </div>
              ) : (
                <ConversationList onSelectConversation={handleSelectConversation} />
              )}
            </div>
          </div>
        )}
        
        {/* Right area - Messages */}
        {(!isMobile || !showConversations) && (
          <div className="w-full md:w-2/3 h-full flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat header */}
                <div className="flex items-center p-4 border-b border-gray-200">
                  {isMobile && (
                    <button 
                      className="mr-3 p-1 rounded-full hover:bg-gray-200"
                      onClick={handleBackToList}
                    >
                      <FaArrowLeft className="text-gray-600" />
                    </button>
                  )}
                  
                  {conversations.find(c => c._id === activeConversation) && (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center overflow-hidden">
                        {(() => {
                          const activeConv = conversations.find(c => c._id === activeConversation);
                          const participant = activeConv?.participant;
                          
                          if (participant?.avatarURL) {
                            return (
                              <img 
                                src={participant.avatarURL} 
                                alt={participant.username || 'User'} 
                                className="w-full h-full object-cover"
                              />
                            );
                          } else {
                            return (
                              <span className="text-lg font-bold text-gray-600">
                                {participant?.fullname?.[0] || participant?.username?.[0] || '?'}
                              </span>
                            );
                          }
                        })()}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {(() => {
                            const activeConv = conversations.find(c => c._id === activeConversation);
                            const participant = activeConv?.participant;
                            return participant?.fullname || participant?.username || 'Unknown User';
                          })()}
                        </h3>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Messages */}
                <MessageList conversationId={activeConversation} />
                
                {/* Message input */}
                <MessageInput 
                  onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 text-center text-gray-500">
                <div>
                  <p className="mb-4 text-lg">Select a conversation or start a new one</p>
                  <button
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg"
                    onClick={() => setShowNewChat(true)}
                  >
                    Start New Conversation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 