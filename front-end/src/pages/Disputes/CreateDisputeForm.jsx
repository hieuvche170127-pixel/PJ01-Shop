import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { checkDisputeEligibility, createDispute, resetDisputeSuccess } from '../../features/dispute/disputeSlice';
import { FaSpinner, FaExclamationCircle, FaTimes, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const CreateDisputeForm = () => {
  const { orderItemId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, eligibility, error, success } = useSelector((state) => state.dispute);
  
  const [formData, setFormData] = useState({
    orderItemId: orderItemId || '',
    description: '',
  });

  // Check if the order item is eligible for dispute when the component mounts
  useEffect(() => {
    if (orderItemId) {
      dispatch(checkDisputeEligibility(orderItemId));
    }
  }, [dispatch, orderItemId]);

  // Redirect to disputes page after successful creation
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(resetDisputeSuccess());
        navigate('/disputes');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createDispute(formData));
  };

  // If we're still checking eligibility, show loading
  if (loading && !eligibility) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
        <p className="text-gray-600">Checking if this order can be disputed...</p>
      </div>
    );
  }

  // If there's an eligibility check and it's not eligible
  if (eligibility && !eligibility.eligible) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-2xl px-4 py-16"
      >
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <FaTimes className="text-red-600 text-2xl" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-4">Cannot Create Dispute</h1>
          <p className="text-gray-700 text-center mb-6">
            {eligibility.message}
          </p>

          {eligibility.disputeId && (
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/disputes')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Your Disputes
              </button>
            </div>
          )}
          
          {!eligibility.disputeId && (
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/order-history')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Return to Order History
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto max-w-2xl px-4 py-8"
    >
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 p-2.5 rounded-full">
            <FaExclamationCircle className="text-red-600 text-xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create a Dispute</h1>
        </div>
        
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-green-100 border border-green-300 p-4 rounded-lg flex items-center gap-3"
            >
              <FaCheck className="text-green-600" />
              <p className="text-green-700">Your dispute has been submitted successfully. Redirecting...</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-red-100 border border-red-300 p-4 rounded-lg flex items-center gap-3"
            >
              <FaTimes className="text-red-600" />
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
              Describe the issue in detail
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="6"
              placeholder="Please provide details about the problem with your order (e.g., damaged product, wrong item, etc.)"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            ></textarea>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.description.trim()}
              className={`px-6 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 
                ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 transition-colors'}`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Dispute'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-gray-700 font-medium mb-2">Important Note</h3>
          <p className="text-gray-600 text-sm">
            Once submitted, disputes will be reviewed by our customer service team. 
            Please provide all relevant information to help us resolve your issue faster.
            You may be contacted for additional details if necessary.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateDisputeForm; 