import React from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = ({ onSelectConversation }) => {
  const { conversations, activeConversation, onlineUsers } = useSelector(state => state.chat);
  const currentUser = useSelector(state => state.auth.user);

  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map(conversation => {
        // Skip conversations with missing participants
        if (!conversation || !conversation.participant) return null;
        
        const otherUser = conversation.participant;
        const isOnline = onlineUsers[otherUser?._id];
        const isActive = activeConversation === conversation._id;
        
        return (
          <div 
            key={conversation._id || `conv-${Math.random()}`}
            onClick={() => onSelectConversation(conversation._id)}
            className={`flex items-center p-3 border-b border-gray-200 hover:bg-gray-100 cursor-pointer ${
              isActive ? 'bg-blue-50' : ''
            }`}
          >
            {/* User avatar with online indicator */}
            <div className="relative mr-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                {otherUser?.avatarURL ? (
                  <img 
                    src={otherUser.avatarURL} 
                    alt={otherUser.username || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-600">
                    {otherUser?.fullname?.[0] || otherUser?.username?.[0] || '?'}
                  </span>
                )}
              </div>
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            
            {/* Conversation details */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 truncate">
                  {otherUser?.fullname || otherUser?.username || 'Unknown User'}
                </h3>
                {conversation.lastMessage?.createdAt && (
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 truncate">
                  {conversation.lastMessage?.content 
                    ? (conversation.lastMessage.sender === currentUser?.id 
                        ? `You: ${conversation.lastMessage.content}`
                        : conversation.lastMessage.content)
                    : 'No messages yet'}
                </p>
                
                {/* Unread indicator */}
                {conversation.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList; 