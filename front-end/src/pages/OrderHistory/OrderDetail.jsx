import { resolveProductImage } from '../../utils/productImage';
import { formatVND } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchOrderDetails, clearOrderDetails } from '../../features/order/orderSlice';
import { createReview, fetchUserReviews } from '../../features/review/reviewSlice';
import { fetchDisputeDetails } from '../../features/dispute/disputeSlice';
import { checkPaymentStatus } from '../../features/payment/paymentSlice';
import { createReturnRequest } from '../../features/returnRequest/returnRequestSlice';
import { FaSpinner, FaStar, FaRegStar, FaArrowLeft, FaCheck, FaBox, FaShippingFast, FaMapMarkerAlt, FaClock, FaReceipt, FaExclamationCircle, FaCreditCard, FaMoneyBill, FaExchangeAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const OrderDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const disputeId = searchParams.get('disputeId');
  const focusItemId = searchParams.get('focusItemId');
  
  const { orderDetails, loading } = useSelector((state) => state.order);
  const { success: reviewSuccess, loading: reviewLoading, userReviews } = useSelector((state) => state.review);
  const { currentDispute, loading: disputeLoading } = useSelector((state) => state.dispute);
  const { success: returnRequestSuccess, loading: returnRequestLoading } = useSelector((state) => state.returnRequest || {});
  
  // State for review form
  const [reviewForm, setReviewForm] = useState({
    productId: '',
    rating: 5,
    comment: '',
  });
  const [reviewFormVisible, setReviewFormVisible] = useState(false);
  
  // State for return request form
  const [returnForm, setReturnForm] = useState({
    orderItemId: '',
    reason: '',
  });
  const [returnFormVisible, setReturnFormVisible] = useState(false);
  
  // State for payment status
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  // Track which products have been reviewed
  const [reviewedProducts, setReviewedProducts] = useState(new Set());
  const [reviewedProductsList, setReviewedProductsList] = useState([]);
  
  // Track which items have return requests
  const [returnRequestedItems, setReturnRequestedItems] = useState(new Set());
  
  // State for dispute display
  const [showDisputeDetails, setShowDisputeDetails] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderDetails(id));
    }
    
    // Fetch user reviews to check which products have already been reviewed
    dispatch(fetchUserReviews({ page: 1, limit: 100 }));
    
    // If disputeId is provided, fetch dispute details
    if (disputeId) {
      dispatch(fetchDisputeDetails(disputeId));
      setShowDisputeDetails(true);
    }
    
    // Cleanup when component unmounts
    return () => {
      dispatch(clearOrderDetails());
    };
  }, [dispatch, id, disputeId]);

  // Fetch payment status when orderDetails are loaded
  useEffect(() => {
    if (orderDetails && orderDetails._id) {
      setCheckingPayment(true);
      
      dispatch(checkPaymentStatus(orderDetails._id))
        .then((resultAction) => {
          if (checkPaymentStatus.fulfilled.match(resultAction)) {
            const data = resultAction.payload;
            setPaymentStatus(data?.payment?.status || null);
            setPaymentMethod(data?.payment?.method || null);
          }
        })
        .finally(() => {
          setCheckingPayment(false);
        });
    }
  }, [dispatch, orderDetails]);
  
  // Update reviewedProducts Set when userReviews are fetched
  useEffect(() => {
    if (userReviews && userReviews.length > 0) {
      const reviewedProductIds = new Set();
      const reviewedList = [];
      
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
          
          if (productId) {
            reviewedList.push(productId);
          }
        }
      });
      
      setReviewedProductsList(reviewedList);
      setReviewedProducts(reviewedProductIds);
      
      // Debug log to check what products are being marked as reviewed
      console.log('Reviewed products:', [...reviewedProductIds]);
    }
  }, [userReviews]);

  // Reset review form when review submission is successful
  useEffect(() => {
    if (reviewSuccess) {
      setReviewForm({
        productId: '',
        rating: 5,
        comment: '',
      });
      setReviewFormVisible(false);
      
      // Refresh user reviews to update the list of reviewed products
      dispatch(fetchUserReviews({ page: 1, limit: 100 }));
    }
  }, [reviewSuccess, dispatch]);
  
  // Reset return form when return request submission is successful
  useEffect(() => {
    if (returnRequestSuccess) {
      setReturnForm({
        orderItemId: '',
        reason: '',
      });
      setReturnFormVisible(false);
      
      // Add the order item ID to the return requested items set
      if (returnForm.orderItemId) {
        setReturnRequestedItems(prev => new Set([...prev, returnForm.orderItemId]));
      }
    }
  }, [returnRequestSuccess, returnForm.orderItemId]);

  // Scroll to the focused item when the component mounts
  useEffect(() => {
    if (focusItemId && !loading) {
      const element = document.getElementById(`order-item-${focusItemId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-item');
        }, 500);
      }
    }
  }, [focusItemId, loading, orderDetails]);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (rating) => {
    setReviewForm((prev) => ({
      ...prev,
      rating,
    }));
  };

  const showReviewForm = (productId) => {
    setReviewForm({
      productId,
      rating: 5,
      comment: '',
    });
    setReviewFormVisible(true);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    dispatch(createReview(reviewForm));
  };
  
  const handleReturnChange = (e) => {
    const { name, value } = e.target;
    setReturnForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const showReturnForm = (orderItemId) => {
    setReturnForm({
      orderItemId,
      reason: '',
    });
    setReturnFormVisible(true);
  };
  
  const handleReturnSubmit = (e) => {
    e.preventDefault();
    dispatch(createReturnRequest(returnForm));
  };
  
  // Handler for proceeding to payment
  const handleProceedToPayment = () => {
    if (!orderDetails || !orderDetails._id) return;
    
    toast.info("Redirecting to payment page...");
    navigate('/payment', { 
      state: { 
        orderId: orderDetails._id, 
        totalPrice: orderDetails.totalPrice,
        preferredMethod: 'PayOS',
        directPayment: true, // This will trigger automatic payment
        replaceExisting: true // Indicate that existing payment records should be deleted
      }
    });
  };
  
  // Check if we should show the payment button
  const shouldShowPaymentButton = () => {
    // Hide button when checking payment status
    if (checkingPayment) return false;
    
    // Don't show payment button for COD orders
    if (paymentMethod === 'COD') return false;
    
    // Show payment button if there's no payment record or payment failed
    if (!paymentStatus || paymentStatus === 'failed') return true;
    
    // Don't show button if payment is completed
    if (paymentStatus === 'paid') return false;
    
    // For all other cases (pending, etc), show the button
    return true;
  };

  const formatDate = (dateString) => {
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
  
  // Helper function to get dispute status badge color
  const getDisputeStatusBadgeColor = (status) => {
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

  // Only show review button for shipped items that haven't been reviewed yet
  const canReview = (item) => {
    if (!item || !item.productId) return false;
    
    const productId = item.productId._id;
    // Make sure item is shipped and has not been reviewed yet
    return item.status === 'shipped' && !reviewedProducts.has(productId);
  };

  // Only show dispute button for shipped items that haven't been disputed yet
  const canDispute = (item) => {
    if (!item || !item.productId) return false;
    
    // Can only dispute shipped items
    return item.status === 'shipped';
  };
  
  // Check if item can be returned (shipped items that haven't been returned yet)
  const canReturn = (item) => {
    if (!item || !item._id) return false;
    
    // Can only return shipped items and not already requested
    return item.status === 'shipped' && !returnRequestedItems.has(item._id);
  };

  // Check if this item has an active dispute
  const hasDispute = (itemId) => {
    if (currentDispute && currentDispute.orderItemId && currentDispute.orderItemId._id === itemId) {
      return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-5xl text-blue-600 mb-4" />
        <p className="text-gray-600 font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center bg-white rounded-xl shadow-md p-8 max-w-lg mx-auto">
          <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
            <FaReceipt className="text-gray-500 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Order not found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
          <Link 
            to="/order-history" 
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium px-6 py-3 rounded-lg"
          >
            <FaArrowLeft className="text-sm" /> Back to Order History
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
          to="/order-history" 
          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2 font-medium transition-colors"
        >
          <FaArrowLeft className="text-sm" /> Back to Order History
        </Link>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6 border border-gray-100"
      >
        <div className="flex justify-between items-start mb-8 flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-100 p-2 rounded-lg">
                <FaReceipt className="text-blue-600" />
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Order #{orderDetails._id.slice(-8).toUpperCase()}
              </h1>
            </div>
            <p className="text-gray-500 flex items-center gap-2">
              <FaClock className="text-sm" />
              Placed on {formatDate(orderDetails.orderDate || orderDetails.createdAt)}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
          <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center border ${getStatusBadgeColor(orderDetails.status)}`}>
            {getStatusIcon(orderDetails.status)}
            {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
            </div>
            
            {/* Payment Status Badge */}
            {checkingPayment ? (
              <div className="flex items-center gap-2 text-gray-500">
                <FaSpinner className="animate-spin" />
                <span>Checking payment...</span>
              </div>
            ) : (
              <div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center border ${getPaymentStatusBadgeColor(paymentStatus)}`}>
                  {getPaymentStatusIcon(paymentStatus)}
                  {paymentStatus === 'paid' && 'Payment Completed'}
                  {paymentStatus === 'pending' && 'Payment Pending'}
                  {paymentStatus === 'failed' && 'Payment Failed'}
                  {!paymentStatus && 'Not Paid'}
                </div>
                {paymentMethod && (
                  <div className="mt-1 text-xs text-gray-600 text-center">
                    {getPaymentMethodText(paymentMethod)}
                  </div>
                )}
              </div>
            )}
            
            {/* Pay Now Button - Only show if not COD and not paid */}
            {shouldShowPaymentButton() && (
              <button
                onClick={handleProceedToPayment}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
              >
                <FaCreditCard />
                Pay Now
              </button>
            )}
          </div>
        </div>
        
        {/* Show dispute details if available */}
        {currentDispute && showDisputeDetails && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-4 border border-red-200 bg-red-50 rounded-lg"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 mb-3">
                <FaExclamationCircle className="text-red-600 text-lg" />
                <h3 className="text-lg font-bold text-gray-800">Dispute Information</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center border ${getDisputeStatusBadgeColor(currentDispute.status)}`}>
                {currentDispute.status === 'open' && <FaExclamationCircle className="mr-1" />}
                {currentDispute.status === 'under_review' && <FaClock className="mr-1" />}
                {(currentDispute.status === 'resolved' || currentDispute.status === 'closed') && <span className="mr-1">✓</span>}
                {currentDispute.status.replace('_', ' ').charAt(0).toUpperCase() + currentDispute.status.replace('_', ' ').slice(1)}
              </div>
            </div>
            
            <div className="mb-2">
              <p className="text-sm text-gray-500">Filed on: {formatDate(currentDispute.createdAt)}</p>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
              <p className="bg-white p-3 rounded-lg text-gray-700 border border-red-100 whitespace-pre-line">
                {currentDispute.description}
              </p>
            </div>
            
            {currentDispute.resolution && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Resolution:</h4>
                <p className="bg-white p-3 rounded-lg text-gray-700 border border-red-100">
                  {currentDispute.resolution}
                </p>
              </div>
            )}
            
            <button
              onClick={() => setShowDisputeDetails(false)}
              className="mt-3 text-gray-600 hover:text-gray-800 font-medium text-sm"
            >
              Hide Dispute Details
            </button>
          </motion.div>
        )}
        
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-50 rounded-lg p-6"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              <FaMapMarkerAlt className="text-blue-500" />
              Shipping Address
            </h2>
            {orderDetails.addressId ? (
              <div className="space-y-1 text-gray-700">
                <p className="font-semibold text-gray-900">{orderDetails.addressId.name || orderDetails.addressId.fullName}</p>
                <p>{orderDetails.addressId.phone}</p>
                <p>{orderDetails.addressId.address || orderDetails.addressId.street}, {orderDetails.addressId.city}</p>
                <p>{orderDetails.addressId.province || orderDetails.addressId.state}, {orderDetails.addressId.country}</p>
                <p>ZIP: {orderDetails.addressId.zipCode}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Address information not available</p>
            )}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-50 rounded-lg p-6"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              <FaBox className="text-blue-500" />
              Order Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Items total:</span>
                <span className="font-medium">{formatVND(orderDetails.totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">Free</span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between text-lg">
                <span className="font-bold text-gray-800">Total:</span>
                <span className="font-bold text-blue-600">{formatVND(orderDetails.totalPrice)}</span>
              </div>
              
              {/* Payment Status */}
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status:</span>
                {checkingPayment ? (
                  <div className="flex items-center gap-2">
                    <FaSpinner className="animate-spin text-gray-500" />
                    <span className="text-gray-500">Checking...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center ${getPaymentStatusBadgeColor(paymentStatus)}`}>
                      {getPaymentStatusIcon(paymentStatus)}
                      {paymentStatus === 'paid' && 'Paid'}
                      {paymentStatus === 'pending' && 'Pending'}
                      {paymentStatus === 'failed' && 'Failed'}
                      {!paymentStatus && 'Not Paid'}
                    </span>
                    {paymentMethod && (
                      <span className="text-xs text-gray-500 mt-1">
                        {getPaymentMethodText(paymentMethod)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Pay Now Button */}
              {shouldShowPaymentButton() && (
                <div className="mt-4">
                  <button
                    onClick={handleProceedToPayment}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                  >
                    <FaCreditCard />
                    Pay Now
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 border-b pb-4">
            <FaBox className="text-blue-500" />
            Order Items
          </h2>
          
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderDetails.items && orderDetails.items.map((item, index) => (
                  <motion.tr 
                    id={`order-item-${item._id}`}
                    key={item._id} 
                    className={`hover:bg-gray-50 transition-colors ${item._id === focusItemId ? 'bg-yellow-50' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.productId?.image ? (
                          <div className="flex-shrink-0 h-14 w-14 mr-4">
                            <img 
                              src={resolveProductImage(item.productId.image)} 
                              alt={item.productId?.title} 
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
                            {item.productId?.title || 'Product not available'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatVND(item.unitPrice)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium bg-gray-100 w-10 h-8 flex items-center justify-center rounded-md">
                        {item.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center w-fit ${getStatusBadgeColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {formatVND((item.unitPrice * item.quantity))}
                    </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-right">
  {item.status === 'shipped' && item.productId && (
    <>
      {reviewedProducts.has(item.productId._id) ? (
        <span className="text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1">
          <FaCheck className="text-xs" /> Reviewed
        </span>
      ) : (
        <button
          className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 transition-colors px-3 py-1.5 rounded-lg text-sm"
          onClick={() => showReviewForm(item.productId._id)}
        >
          Leave Review
        </button>
      )}
    </>
  )}
                        <div className="mt-2 flex gap-2 justify-end flex-wrap">
                        {canDispute(item) && (
                          <div>
                            {/* If this item has a current dispute that matches the one we fetched */}
                            {hasDispute(item._id) ? (
                              <div className="flex items-center justify-end gap-1 text-sm text-red-600">
                                <FaExclamationCircle className="text-xs" /> 
                                <span>Disputed</span>
                                {!showDisputeDetails && (
                                  <button 
                                    onClick={() => setShowDisputeDetails(true)}
                                    className="ml-2 underline text-blue-600 hover:text-blue-800"
                                  >
                                    Show Details
                                  </button>
                                )}
                              </div>
                            ) : (
                              <Link
                                to={`/create-dispute/${item._id}`}
                                className="text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 transition-colors px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1"
                              >
                                <FaExclamationCircle className="text-xs" /> Report Issue
                              </Link>
                            )}
                          </div>
                        )}
                        
                        {canReturn(item) && (
                          <button
                            onClick={() => showReturnForm(item._id)}
                            className="text-amber-600 hover:text-amber-800 font-medium bg-amber-50 hover:bg-amber-100 transition-colors px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1"
                          >
                            <FaExchangeAlt className="text-xs" /> Return Item
                          </button>
                        )}
                        
                        {returnRequestedItems.has(item._id) && (
                          <div className="flex items-center justify-end gap-1 text-sm text-amber-600">
                            <FaExchangeAlt className="text-xs" /> 
                            <span>Return Requested</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="border-t-2 border-gray-200">
                  <td colSpan="4" className="px-6 py-4 text-right font-bold text-gray-700">
                    Total:
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">
                    {formatVND(orderDetails.totalPrice)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Review Form Modal */}
      <AnimatePresence>
        {reviewFormVisible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative mx-auto p-8 bg-white w-full max-w-md rounded-xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Write a Review</h3>
                <button
                  onClick={() => setReviewFormVisible(false)}
                  className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-3">
                    Your Rating
                  </label>
                  <div className="flex gap-2 bg-gray-50 p-3 rounded-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="text-2xl focus:outline-none transition-transform hover:scale-110"
                      >
                        {star <= reviewForm.rating ? 
                          <FaStar className="text-yellow-400" /> : 
                          <FaRegStar className="text-gray-300" />
                        }
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="comment" className="block text-gray-700 text-sm font-bold mb-3">
                    Your Review
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={reviewForm.comment}
                    onChange={handleReviewChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Share your experience with this product..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewFormVisible(false)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                    disabled={reviewLoading}
                  >
                    {reviewLoading ? (
                      <>
                        <FaSpinner className="animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <FaCheck /> Submit Review
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Return Request Form Modal */}
      <AnimatePresence>
        {returnFormVisible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative mx-auto p-8 bg-white w-full max-w-md rounded-xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Return Request</h3>
                <button
                  onClick={() => setReturnFormVisible(false)}
                  className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleReturnSubmit}>
                <div className="mb-6">
                  <label htmlFor="reason" className="block text-gray-700 text-sm font-bold mb-3">
                    Reason for Return
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={returnForm.reason}
                    onChange={handleReturnChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    placeholder="Please explain why you want to return this item..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnFormVisible(false)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors flex items-center gap-2"
                    disabled={returnRequestLoading}
                  >
                    {returnRequestLoading ? (
                      <>
                        <FaSpinner className="animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <FaExchangeAlt /> Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add CSS for highlight animation */}
      <style jsx="true">{`
        .highlight-item {
          animation: highlight 2s ease-in-out;
        }
        
        @keyframes highlight {
          0% { background-color: #fff; }
          25% { background-color: rgba(253, 224, 71, 0.5); }
          75% { background-color: rgba(253, 224, 71, 0.5); }
          100% { background-color: #fff; }
        }
      `}</style>
    </div>
  );
};

export default OrderDetail; 