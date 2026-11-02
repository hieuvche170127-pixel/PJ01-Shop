import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import SellerService from '../services/api/SellerService';
import UserService from '../services/api/UserService';

const StoreRegistration = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get current user from Redux state
  const { user, token, isAuthenticated } = useSelector(state => state.auth);
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to register as a seller');
      navigate('/signin');
    }
  }, [isAuthenticated, navigate]);
  
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    bannerImageURL: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Update user role to seller
      const response = await UserService.changeRole('seller');
      
      // Update the Redux store with the updated user info
      if (response.success) {
        dispatch(setCredentials({
          user: { ...user, role: 'seller' },
          token: response.token || token // Use new token if provided
        }));
        
        // 2. Create store profile after role change
        try {
          await SellerService.createStore({
            storeName: formData.storeName,
            description: formData.description,
            bannerImageURL: formData.bannerImageURL,
          });
          
          toast.success('Store registered successfully! Your seller account is pending approval.');
          navigate('/'); // Redirect to home page
        } catch (storeError) {
          toast.error('Role updated but failed to create store: ' + (storeError.response?.data?.message || 'Unknown error'));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register as seller');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg"
      >
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Register as Seller
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set up your store and start selling on Shopii
          </p>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Store Name */}
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
                Store Name
              </label>
              <input
                id="storeName"
                name="storeName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F52BA] focus:border-[#0F52BA] sm:text-sm transition-all duration-200"
                placeholder="Your Store Name"
                value={formData.storeName}
                onChange={handleChange}
              />
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F52BA] focus:border-[#0F52BA] sm:text-sm transition-all duration-200"
                placeholder="Describe your store"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            
            {/* Banner Image URL */}
            <div>
              <label htmlFor="bannerImageURL" className="block text-sm font-medium text-gray-700">
                Banner Image URL (optional)
              </label>
              <input
                id="bannerImageURL"
                name="bannerImageURL"
                type="url"
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F52BA] focus:border-[#0F52BA] sm:text-sm transition-all duration-200"
                placeholder="https://example.com/banner-image.jpg"
                value={formData.bannerImageURL}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#0F52BA] hover:bg-[#0A3C8A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F52BA] transition-all duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </>
              ) : (
                'Register Store'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default StoreRegistration; 