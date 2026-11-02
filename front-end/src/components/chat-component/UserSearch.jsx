import { API_URL } from '../../utils/apiUrl';
import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { useSelector } from 'react-redux';

const UserSearch = ({ onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  const currentUser = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);
  
  
  
  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim() || query.length < 2) {
        setUsers([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/users/search?query=${encodeURIComponent(query)}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Filter out the current user
        const filteredUsers = response.data.users.filter(user => 
          user._id !== currentUser?.id
        );
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error searching users:', error);
        setError('Failed to search users');
      } finally {
        setLoading(false);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        searchUsers();
      }
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [query, API_URL, token, currentUser]);
  
  const handleFocus = () => {
    setShowResults(true);
  };
  
  const handleBlur = () => {
    // Use timeout to allow click events to complete first
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };
  
  const handleSelectUser = (user) => {
    setQuery('');
    setUsers([]);
    onSelectUser(user);
  };
  
  return (
    <div className="relative">
      <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
        <FaSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search users..."
          className="bg-transparent w-full outline-none text-gray-800"
        />
        {loading && <FaSpinner className="animate-spin text-gray-500" />}
      </div>
      
      {showResults && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-md max-h-60 overflow-y-auto z-10 border border-gray-200">
          {error && (
            <div className="p-3 text-red-500 text-center">
              {error}
            </div>
          )}
          
          {!loading && !error && users.length === 0 && (
            <div className="p-3 text-gray-500 text-center">
              No users found
            </div>
          )}
          
          {users.map(user => (
            <div
              key={user._id}
              className="flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
              onClick={() => handleSelectUser(user)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center overflow-hidden">
                {user.avatarURL ? (
                  <img 
                    src={user.avatarURL} 
                    alt={user.username} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-lg font-bold text-gray-600">
                    {user.fullname?.[0] || user.username?.[0] || '?'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  {user.fullname || user.username}
                </p>
                {user.fullname && user.username !== user.fullname && (
                  <p className="text-sm text-gray-500">
                    @{user.username}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch; 