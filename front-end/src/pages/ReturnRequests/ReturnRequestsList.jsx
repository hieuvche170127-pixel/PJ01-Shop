import { resolveProductImage } from '../../utils/productImage';
import { formatVND } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserReturnRequests, cancelReturnRequest } from '../../features/returnRequest/returnRequestSlice';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { FaSpinner, FaBox, FaArrowLeft, FaExchangeAlt, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ReturnRequestsList = () => {
  const dispatch = useDispatch();
  const { requests, loading, error } = useSelector((state) => state.returnRequest || { requests: [], loading: false, error: null });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchUserReturnRequests());
  }, [dispatch]);

  // Format date in a readable format
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Handle return request cancellation
  const handleCancelRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this return request?')) {
      setCancelLoading(true);
      try {
        await dispatch(cancelReturnRequest(requestId)).unwrap();
        toast.success('Return request cancelled successfully');
        setSelectedRequest(null);
      } catch (err) {
        toast.error('Failed to cancel return request');
      } finally {
        setCancelLoading(false);
      }
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="mr-1" />;
      case 'approved':
        return <FaCheck className="mr-1" />;
      case 'rejected':
        return <FaTimes className="mr-1" />;
      case 'completed':
        return <FaCheck className="mr-1" />;
      default:
        return null;
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-5xl text-blue-600 mb-4" />
        <p className="text-gray-600 font-medium">Loading return requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center bg-white rounded-xl shadow-md p-8 max-w-lg mx-auto">
          <div className="bg-red-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
            <FaTimes className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Error Loading Return Requests</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => dispatch(fetchUserReturnRequests())}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium px-6 py-3 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mb-6">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2 font-medium transition-colors"
          >
            <FaArrowLeft className="text-sm" /> Back to Home
          </Link>
        </div>
        <div className="text-center bg-white rounded-xl shadow-md p-8 max-w-lg mx-auto">
          <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
            <FaExchangeAlt className="text-gray-500 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">No Return Requests Yet</h2>
          <p className="text-gray-600 mb-6">You haven't made any return requests yet.</p>
          <Link
            to="/order-history"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium px-6 py-3 rounded-lg"
          >
            View Your Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2 font-medium transition-colors"
        >
          <FaArrowLeft className="text-sm" /> Back to Home
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6 border border-gray-100"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaExchangeAlt className="text-amber-600" />
            Return Requests
          </h1>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => {
                const productData = request.orderItemId?.productId;
                const orderData = request.orderItemId?.orderId;

                return (
                  <motion.tr
                    key={request._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {productData?.image ? (
                          <div className="flex-shrink-0 h-14 w-14 mr-4">
                            <img
                              src={productData.image}
                              alt={productData.title}
                              className="h-14 w-14 object-cover rounded-lg shadow-sm"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-14 w-14 bg-gray-100 rounded-lg mr-4 flex items-center justify-center">
                            <FaBox className="text-gray-400 text-xl" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {productData?.title || 'Product not available'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Qty: {request.orderItemId?.quantity || 1}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {orderData ? (
                        <Link
                          to={`/order-history/${orderData._id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          #{orderData._id.slice(-8).toUpperCase()}
                        </Link>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(request.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center ${getStatusBadgeColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 transition-colors px-3 py-1.5 rounded-lg text-sm"
                        >
                          View Details
                        </button>
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest(request._id)}
                            disabled={cancelLoading}
                            className="text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 transition-colors px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                          >
                            {cancelLoading ? (
                              <>
                                <FaSpinner className="animate-spin text-xs" /> Cancelling...
                              </>
                            ) : (
                              <>
                                <FaTimes className="text-xs" /> Cancel
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="relative bg-white w-full max-w-2xl p-8 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaExchangeAlt className="text-amber-600" />
                Return Request Details
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">Request ID</p>
                  <p className="font-medium text-gray-900">{selectedRequest._id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center ${getStatusBadgeColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created On</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium text-gray-900">
                    {selectedRequest.orderItemId?.orderId ? (
                      <Link
                        to={`/order-history/${selectedRequest.orderItemId.orderId._id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        #{selectedRequest.orderItemId.orderId._id.slice(-8).toUpperCase()}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-2">Product Information</h4>
              <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                {selectedRequest.orderItemId?.productId?.image ? (
                  <div className="flex-shrink-0 h-16 w-16 mr-4">
                    <img
                      src={resolveProductImage(selectedRequest.orderItemId.productId.image)}
                      alt={selectedRequest.orderItemId.productId.title}
                      className="h-16 w-16 object-cover rounded-lg shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-lg mr-4 flex items-center justify-center">
                    <FaBox className="text-gray-400 text-xl" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedRequest.orderItemId?.productId?.title || 'Product not available'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Quantity: {selectedRequest.orderItemId?.quantity || 1}
                  </div>
                  {selectedRequest.orderItemId?.productId?.price && (
                    <div className="text-sm font-medium text-gray-900">
                      Price: {formatVND(selectedRequest.orderItemId.productId.price)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-2">Return Reason</h4>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                {selectedRequest.reason}
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => handleCancelRequest(selectedRequest._id)}
                  disabled={cancelLoading}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
                >
                  {cancelLoading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Cancelling...
                    </>
                  ) : (
                    <>
                      <FaTimes /> Cancel Request
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnRequestsList; 