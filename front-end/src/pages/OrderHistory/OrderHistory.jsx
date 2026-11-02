import { API_URL } from '../../utils/apiUrl';
import { resolveProductImage } from '../../utils/productImage';
import { formatVND } from '../../utils/currency';
import axios from 'axios';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchOrderHistory } from '../../features/order/orderSlice';
import { fetchUserReviews } from '../../features/review/reviewSlice';
import { checkPaymentStatus } from '../../features/payment/paymentSlice';
import { FaSpinner, FaChevronDown, FaChevronUp, FaBox, FaClock, FaShippingFast, FaCheck, FaStar, FaShoppingBag, FaFilter, FaSearch, FaMoneyBill, FaCreditCard } from 'react-icons/fa';
import Pagination from '../../components/common/Pagination';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const OrderHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, pagination, loading } = useSelector((state) => state.order);
  const { userReviews } = useSelector((state) => state.review);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancellingItem, setCancellingItem] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const cancelItem = async itemId => {
    if (cancellingItem || !itemId) return;
    setCancellingItem(itemId);
    try {
      await axios.put(`${API_URL}/buyers/orders/items/${itemId}/status`, { status: 'rejected' }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success('Đã hủy và hoàn kho.');
      setCancelTarget(null);
      setPaymentStatuses({});
    } catch (error) { toast.error(error.response?.data?.message || 'Chưa hủy được. Vui lòng thử lại.'); }
    finally { await dispatch(fetchOrderHistory({ page: currentPage, limit: 10, status: statusFilter })); setCancellingItem(null); }
  };
  const [expandedOrders, setExpandedOrders] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const [checkingPayment, setCheckingPayment] = useState({});
  
  // Track which products have been reviewed
  const [reviewedProducts, setReviewedProducts] = useState(new Set());

  useEffect(() => {
    dispatch(fetchOrderHistory({ page: currentPage, limit: 10, status: statusFilter }));
    // Also fetch user reviews to check which products have already been reviewed
    dispatch(fetchUserReviews({ page: 1, limit: 100 }));
  }, [dispatch, currentPage, statusFilter]);

  // Check payment status for all orders when orders are loaded
  useEffect(() => {
    if (orders && orders.length > 0) {
      const newPaymentStatuses = { ...paymentStatuses };
      const newPaymentMethods = { ...paymentMethods };
      const newCheckingPayment = { ...checkingPayment };
      
      orders.forEach(order => {
        if (!paymentStatuses[order._id]) {
          // Mark as checking
          newCheckingPayment[order._id] = true;
          setCheckingPayment(newCheckingPayment);
          
          // Check payment status
          dispatch(checkPaymentStatus(order._id))
            .then((resultAction) => {
              if (checkPaymentStatus.fulfilled.match(resultAction)) {
                const data = resultAction.payload;
                setPaymentStatuses(prev => ({
                  ...prev,
                  [order._id]: data?.payment?.status || null
                }));
                setPaymentMethods(prev => ({
                  ...prev,
                  [order._id]: data?.payment?.method || null
                }));
              }
            })
            .finally(() => {
              setCheckingPayment(prev => ({
                ...prev,
                [order._id]: false
              }));
            });
        }
      });
    }
  }, [dispatch, orders]);

  // Update reviewedProducts Set when userReviews are fetched
  useEffect(() => {
    if (userReviews && userReviews.length > 0) {
      const reviewedProductIds = new Set();
      
      userReviews.forEach(review => {
        // Only consider primary reviews (not replies)
        if (review.parentId === null || !review.parentId) {
          let productId = null;
          
          if (review.productId?._id) {
            productId = review.productId._id;
            reviewedProductIds.add(productId);
          } else if (typeof review.productId === 'string') {
            productId = review.productId;
            reviewedProductIds.add(productId);
          }
        }
      });
      
      setReviewedProducts(reviewedProductIds);
      console.log('OrderHistory - Reviewed products:', [...reviewedProductIds]);
    } else {
      // If no reviews, ensure set is empty
      setReviewedProducts(new Set());
    }
  }, [userReviews]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };
  
  // Handler for proceeding to payment
  const handleProceedToPayment = (orderId) => {
    toast.info("Redirecting to payment page...");
    navigate('/payment', { 
      state: { 
        orderId,
        preferredMethod: 'PayOS',
        directPayment: true, // This will trigger automatic payment
        replaceExisting: true // Indicate that existing payment records should be deleted
      }
    });
  };

  // Check if we should show the payment button for this order
  const shouldShowPaymentButton = (orderId) => {
    if (orders.find(order => order._id === orderId)?.status === 'rejected') return false;
    const paymentStatus = paymentStatuses[orderId];
    const paymentMethod = paymentMethods[orderId];
    
    // Hide button when checking payment status
    if (checkingPayment[orderId]) return false;
    
    // Don't show payment button for COD orders
    if (paymentMethod === 'COD') return false;
    
    // Show payment button if there's no payment record or payment failed
    if (!paymentStatus || paymentStatus === 'failed') return true;
    
    // Don't show button if payment is completed
    if (paymentStatus === 'paid') return false;
    
    // For all other cases (pending, etc), show the button
    return true;
  };

  // Helper function to format order date
  const formatOrderDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'shipping':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shipped':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'failed to ship':
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Helper function to get payment status badge color
  const getPaymentStatusBadgeColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'failed':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="mr-1" />;
      case 'shipping':
        return <FaShippingFast className="mr-1" />;
      case 'shipped':
        return <FaCheck className="mr-1" />;
      case 'failed to ship':
      case 'rejected':
        return <span className="mr-1">×</span>;
      default:
        return null;
    }
  };

  // Helper function to get payment status icon
  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FaCheck className="mr-1" />;
      case 'pending':
        return <FaClock className="mr-1" />;
      case 'failed':
        return <span className="mr-1">×</span>;
      default:
        return <FaMoneyBill className="mr-1" />;
    }
  };

  // Get payment method display text
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'COD':
        return 'Cash on Delivery';
      case 'VietQR':
        return 'VietQR';
      case 'PayOS':
        return 'PayOS';
      default:
        return 'Not Specified';
    }
  };

  // Check if a product has already been reviewed
  const hasBeenReviewed = (productId) => {
    // Check if the product ID exists in our set of reviewed products
    return productId ? reviewedProducts.has(productId) : false;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2.5 rounded-full">
            <FaShoppingBag className="text-blue-600 text-xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Orders</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search field */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FaSearch className="absolute left-3.5 top-3.5 text-gray-400" />
          </div>
          
          {/* Status filter */}
          <div className="relative">
            <select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusChange}
              className="border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 w-full appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="shipping">Shipping</option>
              <option value="shipped">Shipped</option>
              <option value="failed to ship">Failed to Ship</option>
              <option value="rejected">Rejected</option>
            </select>
            <FaFilter className="absolute left-3.5 top-3.5 text-gray-400" />
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
          <p className="text-gray-600 font-medium">Loading your orders...</p>
        </motion.div>
      ) : orders && orders.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-5">
            {orders.map((order, index) => (
              <motion.div 
                key={order._id} 
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index % 5) }}
              >
                {/* Order Header */}
                <div className={`flex justify-between items-center p-5 ${expandedOrders[order._id] ? 'bg-blue-50 border-b border-blue-100' : 'bg-white'}`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">Order ID</span>
                      <span className="font-mono font-medium text-gray-800">{order._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">Date</span>
                      <span className="text-sm text-gray-800">{formatOrderDate(order.orderDate || order.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">Total</span>
                      <span className="font-medium text-gray-800">{formatVND(order.totalPrice)}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center border ${getStatusBadgeColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">Payment</span>
                      {checkingPayment[order._id] ? (
                        <span className="inline-flex items-center">
                          <FaSpinner className="animate-spin mr-2 text-gray-500" />
                          <span className="text-gray-500 text-sm">Checking...</span>
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center border ${getPaymentStatusBadgeColor(paymentStatuses[order._id])}`}>
                            {getPaymentStatusIcon(paymentStatuses[order._id])}
                            {paymentStatuses[order._id] === 'paid' && 'Paid'}
                            {paymentStatuses[order._id] === 'pending' && 'Pending'}
                            {paymentStatuses[order._id] === 'failed' && 'Failed'}
                            {!paymentStatuses[order._id] && 'Not Paid'}
                          </span>
                          {paymentMethods[order._id] && (
                            <span className="text-xs text-gray-500">
                              {getPaymentMethodText(paymentMethods[order._id])}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {shouldShowPaymentButton(order._id) && (
                      <button
                        onClick={() => handleProceedToPayment(order._id)}
                        className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <FaCreditCard />
                        Pay Now
                      </button>
                    )}
                    
                    <Link 
                      to={`/order-details/${order._id}`}
                      className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 transition-colors px-4 py-2 rounded-lg text-sm font-medium hidden md:block"
                    >
                      View Details
                    </Link>
                    <button 
                      onClick={() => toggleOrderExpansion(order._id)} 
                      className={`text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-all ${expandedOrders[order._id] ? 'bg-gray-100 rotate-180' : ''}`}
                      aria-label={expandedOrders[order._id] ? "Collapse order" : "Expand order"}
                    >
                      <FaChevronDown className={`transition-transform ${expandedOrders[order._id] ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Order Items (expanded) */}
                {expandedOrders[order._id] && order.items && order.items.length > 0 && (
                  <motion.div 
                    className="p-5"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h3 className="font-medium mb-4 flex items-center gap-2 text-gray-800">
                      <FaBox className="text-blue-500" />
                      Order Items
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {order.items.map((item, itemIndex) => (
                            <motion.tr 
                              key={item._id} 
                              className="hover:bg-gray-50 transition-colors"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 * (itemIndex + 1) }}
                            >
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="flex items-center">
                                  {item.productId?.image ? (
                                    <div className="flex-shrink-0 h-12 w-12 mr-3">
                                      <img 
                                        src={resolveProductImage(item.productId.image)} 
                                        alt={item.productId?.title} 
                                        className="h-12 w-12 object-cover rounded-lg shadow-sm"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-lg mr-3 flex items-center justify-center">
                                      <FaBox className="text-gray-400" />
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-gray-900 line-clamp-1">
                                    {item.productId?.title || 'Product not available'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{formatVND(item.unitPrice)}</div>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="text-sm font-medium bg-gray-100 w-10 h-8 flex items-center justify-center rounded-md">
                                  {item.quantity}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center w-fit ${getStatusBadgeColor(item.status)}`}>
                                  {getStatusIcon(item.status)}
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                {item.status === 'pending' && <button disabled={!!cancellingItem} onClick={() => setCancelTarget(item._id)} className="text-red-700 border border-red-300 rounded px-3 py-1 mr-2 disabled:opacity-50">{cancellingItem === item._id ? 'Đang hủy...' : 'Hủy sản phẩm'}</button>}
                                {item.status === 'rejected' && <span>{item.cancelledBy === 'buyer' ? 'Đã hủy' : 'Đã từ chối'}</span>}
                                {item.status === 'shipped' && item.productId && (
                                  <>
                                    {reviewedProducts.has(item.productId._id) ? (
                                      <span className="text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1">
                                        <FaCheck className="text-xs" /> Reviewed
                                      </span>
                                    ) : (
                                      <Link 
                                        to={`/write-review/${item.productId._id}`} 
                                        className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 transition-colors px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1"
                                      >
                                        <FaStar className="text-yellow-400 text-xs" /> 
                                        Write Review
                                      </Link>
                                    )}
                                  </>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        {shouldShowPaymentButton(order._id) && (
                          <button
                            onClick={() => handleProceedToPayment(order._id)}
                            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 md:hidden"
                          >
                            <FaCreditCard />
                            Pay Now
                          </button>
                        )}
                      </div>
                      <Link 
                        to={`/order-details/${order._id}`}
                        className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 transition-colors px-4 py-2 rounded-lg text-sm font-medium md:hidden flex items-center gap-2"
                      >
                        View Complete Details
                      </Link>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
          
          {pagination && pagination.pages > 1 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
              className="mt-6"
            />
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border rounded-xl p-12 text-center shadow-sm max-w-lg mx-auto"
        >
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaShoppingBag className="text-blue-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Orders Yet</h2>
          <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping to see your orders here.</p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 font-medium"
          >
            <FaShoppingBag className="text-sm" />
            Start Shopping
          </Link>
        </motion.div>
      )}
      <Dialog open={!!cancelTarget} onClose={() => !cancellingItem && setCancelTarget(null)} aria-labelledby="cancel-order-title">
        <DialogTitle id="cancel-order-title">Hủy sản phẩm trong đơn?</DialogTitle>
        <DialogContent>Sản phẩm đang chờ xử lý sẽ được hủy và số lượng được hoàn lại kho.</DialogContent>
        <DialogActions>
          <Button disabled={!!cancellingItem} onClick={() => setCancelTarget(null)}>Giữ đơn</Button>
          <Button color="error" disabled={!!cancellingItem} onClick={() => cancelItem(cancelTarget)}>{cancellingItem ? 'Đang hủy...' : 'Xác nhận hủy'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OrderHistory; 