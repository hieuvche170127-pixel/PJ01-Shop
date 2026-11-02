import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';

const MessageList = ({ conversationId }) => {
  const { messages, typingUsers } = useSelector(state => state.chat);
  const currentUser = useSelector(state => state.auth.user);
  const messagesEndRef = useRef(null);
  const [expandedImage, setExpandedImage] = useState(null);
  
  const conversationMessages = messages[conversationId] || [];
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length]);
  
  // Check if someone is typing in this conversation
  const isTyping = Object.values(typingUsers[conversationId] || {}).some(typing => typing);
  
  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          Please login to view messages
        </div>
      </div>
    );
  }
  
  const handleImageClick = (imageUrl) => {
    setExpandedImage(imageUrl);
  };
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {conversationMessages.length === 0 && (
        <div className="text-center text-gray-500 my-10">
          No messages yet. Start the conversation!
        </div>
      )}
      
      {conversationMessages.map((message, index) => {
        // Skip messages with missing sender info
        if (!message || !message.sender) return null;
        
        const isMine = message.sender._id === currentUser.id;
        const showAvatar = index === 0 || 
          (conversationMessages[index - 1]?.sender?._id !== message.sender._id);
        
        // Check if message has an image
        const hasImage = message.image && (message.image.url || message.image.secure_url);
        const imageUrl = hasImage ? (message.image.secure_url || message.image.url) : null;
        
        return (
          <div 
            key={message._id}
            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%]`}>
              {/* Message content */}
              <div 
                className={`p-3 rounded-lg ${
                  isMine 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-gray-200 text-gray-800 rounded-tl-none'
                }`}
              >
                {/* Text content */}
                {message.content && <div className={hasImage ? 'mb-2' : ''}>{message.content}</div>}
                
                {/* Image content */}
                {hasImage && (
                  <div className="mt-1">
                    <img 
                      src={imageUrl}
                      alt="Message attachment" 
                      className="max-w-full max-h-64 rounded cursor-pointer"
                      onClick={() => handleImageClick(imageUrl)}
                    />
                  </div>
                )}
              </div>
              
              {/* Message timestamp */}
              <div className={`text-xs mt-1 ${isMine ? 'text-right' : 'text-left'} text-gray-500`}>
                {message.createdAt && format(new Date(message.createdAt), 'h:mm a')}
                {isMine && message.read && (
                  <span className="ml-1 text-blue-500">✓</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Typing indicator */}
      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-gray-200 p-3 rounded-lg text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image viewer modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={expandedImage} 
              alt="Expanded view" 
              className="max-w-full max-h-[90vh] object-contain" 
            />
            <button 
              className="absolute top-2 right-2 bg-white rounded-full p-2 text-black"
              onClick={() => setExpandedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 