import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchUserDisputes, cancelDispute } from '../../features/dispute/disputeSlice';
import { FaSpinner, FaExclamationCircle, FaClock, FaSearch, FaChevronDown, FaChevronUp, FaBan } from 'react-icons/fa';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const MyDisputes = () => {
  const dispatch = useDispatch();
  const { disputes, loading, success } = useSelector((state) => state.dispute);
  const [expandedDisputes, setExpandedDisputes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchUserDisputes());
  }, [dispatch, success]);
  
  // Log disputes để kiểm tra cấu trúc chính xác
  useEffect(() => {
    if (disputes && disputes.length > 0) {
      console.log("Dispute structure:", disputes[0]);
      
      // Kiểm tra cấu trúc của orderItemId
      if (disputes[0].orderItemId) {
        console.log("OrderItem structure:", disputes[0].orderItemId);
        
        // Kiểm tra xem orderId là đối tượng hay string
        if (disputes[0].orderItemId.orderId) {
          console.log("OrderId type:", typeof disputes[0].orderItemId.orderId);
          console.log("OrderId value:", disputes[0].orderItemId.orderId);
        }
      }
    }
  }, [disputes]);

  const toggleDisputeExpansion = (disputeId) => {
    setExpandedDisputes(prev => ({
      ...prev,
      [disputeId]: !prev[disputeId]
    }));
  };

  const handleCancelDispute = (disputeId) => {
    if (window.confirm('Are you sure you want to cancel this dispute? This action cannot be undone.')) {
      dispatch(cancelDispute(disputeId));
    }
  };

  // Format date helper function
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status badge color helper
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'under_review':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Filter disputes by status and search
  const filteredDisputes = disputes
    .filter(dispute => !statusFilter || dispute.status === statusFilter)
    .filter(dispute => {
      if (!searchQuery) return true;
      
      const productName = dispute.orderItemId?.productId?.name || '';
      const description = dispute.description || '';
      const searchLower = searchQuery.toLowerCase();
      
      return (
        productName.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower)
      );
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2.5 rounded-full">
            <FaExclamationCircle className="text-red-600 text-xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Disputes</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search field */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search disputes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FaSearch className="absolute left-3.5 top-3.5 text-gray-400" />
          </div>
          
          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 w-full appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <FaChevronDown className="absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col justify-center items-center py-20"
        >
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
          <p className="text-gray-600 font-medium">Loading your disputes...</p>
        </motion.div>
      ) : filteredDisputes.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredDisputes.map((dispute, index) => (
            <motion.div 
              key={dispute._id} 
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index % 5) }}
            >
              {/* Dispute Header */}
              <div className={`flex justify-between items-center p-5 ${expandedDisputes[dispute._id] ? 'bg-gray-50 border-b' : ''}`}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center border ${getStatusBadgeColor(dispute.status)}`}>
                      {dispute.status === 'open' && <FaExclamationCircle className="mr-1" />}
                      {dispute.status === 'under_review' && <FaClock className="mr-1" />}
                      {(dispute.status === 'resolved' || dispute.status === 'closed') && <span className="mr-1">✓</span>}
                      {dispute.status.replace('_', ' ').charAt(0).toUpperCase() + dispute.status.replace('_', ' ').slice(1)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {formatDate(dispute.createdAt)}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900">
                    {dispute.orderItemId?.productId?.name || 'Product Unavailable'}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  {(dispute.status === 'open' || dispute.status === 'under_review') && (
                    <button
                      onClick={() => handleCancelDispute(dispute._id)}
                      className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 transition-colors px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                      <FaBan className="text-sm" /> Cancel
                    </button>
                  )}
                  <button 
                    onClick={() => toggleDisputeExpansion(dispute._id)}
                    className="text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
                  >
                    {expandedDisputes[dispute._id] ? (
                      <FaChevronUp className="text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Expanded Content */}
              {expandedDisputes[dispute._id] && (
                <motion.div 
                  className="p-5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
                    <p className="bg-gray-50 p-3 rounded-lg text-gray-700 whitespace-pre-line">
                      {dispute.description}
                    </p>
                  </div>
                  
                  {dispute.resolution && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Resolution:</h4>
                      <p className="bg-gray-50 p-3 rounded-lg text-gray-700">
                        {dispute.resolution}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    {/* Thêm một helper function để lấy orderId */}
                    {(() => {
                      // Cố gắng lấy orderId theo nhiều cách
                      let orderId = null;
                      
                      // Kiểm tra từng trường hợp có thể xảy ra
                      if (dispute.orderItemId?.orderId?._id) {
                        // Trường hợp orderId là một đối tượng đã được populate
                        orderId = dispute.orderItemId.orderId._id;
                      } else if (dispute.orderItemId?.orderId) {
                        // Trường hợp orderId là một string id
                        orderId = dispute.orderItemId.orderId;
                      }
                      
                      // Log ra để debug
                      console.log("Order ID for dispute:", orderId);
                      
                      // Chỉ hiển thị liên kết nếu có orderId
                      if (orderId) {
                        return (
                          <Link
                            to={`/order-details/${orderId}?disputeId=${dispute._id}&focusItemId=${dispute.orderItemId?._id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-2 w-fit"
                          >
                            View Order Details →
                          </Link>
                        );
                      } else {
                        return (
                          <span className="text-gray-400 text-sm">
                            Order details not available
                          </span>
                        );
                      }
                    })()}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border rounded-xl p-12 text-center shadow-sm max-w-lg mx-auto"
        >
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaExclamationCircle className="text-gray-400 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Disputes Found</h2>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter ? 
              'No disputes match your current filters. Try changing your search criteria.' :
              'You have not filed any disputes yet.'}
          </p>
          <Link
            to="/order-history"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 font-medium"
          >
            View Your Orders
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default MyDisputes; 