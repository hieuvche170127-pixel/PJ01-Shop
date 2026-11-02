import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaSmile, FaImage, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../../utils/apiUrl';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const token = useSelector(state => state.auth.token);
  const [sending, setSending] = useState(false);
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);
  
  // Focus the input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Handle typing indicator
  useEffect(() => {
    if (message && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 1000);
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTyping]);
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(file.type)) {
      alert('Please select an image file');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  
  const uploadImage = async () => {
    if (!imageFile) return null;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      
      
      const response = await axios.post(
        `${API_URL}/images/upload`, 
        formData,
        { 
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          } 
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const hasText = message.trim().length > 0;
    const hasImage = imageFile !== null;
    
    if ((!hasText && !hasImage) || sending || isUploading) return;
    
    let imageData = null;
    
    if (hasImage) {
      imageData = await uploadImage();
      if (!imageData) return; // If image upload failed and no text, exit
    }
    
    // Send message with image if available
    setSending(true);
    try { await onSendMessage(message, imageData); }
    catch (error) { alert(error.message || 'Không gửi được tin nhắn'); return; }
    finally { setSending(false); }
    
    // Reset state
    setMessage('');
    clearImage();
    
    // Clear typing indicator
    setIsTyping(false);
    onTyping(false);
    
    // Focus the input again
    inputRef.current?.focus();
  };
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
      {imagePreview && (
        <div className="relative w-32 h-32 mb-2 mx-auto md:mx-0">
          <img 
            src={imagePreview} 
            alt="Upload preview" 
            className="w-full h-full object-contain rounded-lg border border-gray-300" 
          />
          <button 
            type="button"
            onClick={clearImage}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      )}
      
      <div className="flex items-center bg-gray-100 rounded-full overflow-hidden pr-2">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 py-2 px-4 bg-transparent outline-none"
          placeholder="Type a message..."
          disabled={isUploading || sending}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        
        <button
          type="button"
          onClick={handleImageClick}
          className="text-gray-500 hover:text-gray-700 mr-2"
          title="Upload image"
          disabled={isUploading || sending}
        >
          <FaImage className="w-5 h-5" />
        </button>
        
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 mr-2"
          title="Insert emoji"
          disabled={isUploading || sending}
        >
          <FaSmile className="w-5 h-5" />
        </button>
        
        <button
          type="submit"
          className={`rounded-full p-2 ${
            (message.trim() || imageFile) && !isUploading
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={(!message.trim() && !imageFile) || isUploading}
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FaPaperPlane className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput; 