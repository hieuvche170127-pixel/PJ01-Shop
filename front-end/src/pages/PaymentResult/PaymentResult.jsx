import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { resetPayment, checkPaymentStatus, cancelPaymentPolling } from '../../features/payment/paymentSlice';
import { motion } from 'framer-motion';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress,
  Divider
} from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HomeIcon from '@mui/icons-material/Home';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [countDown, setCountDown] = useState(5);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState({
    status: '',
    orderId: '',
    message: ''
  });
  
  // Get query parameters from URL
  const query = new URLSearchParams(location.search);
  const queryStatus = query.get('status');
  const queryOrderId = query.get('orderId') || query.get('orderCode');
  const queryMessage = query.get('message');
  const locationState = location.state || {};

  // Check PayOS specific status
  const payosStatus = query.get('status'); // PAID, CANCELLED, etc.
  
  // Check if payment was already completed via sessionStorage
  useEffect(() => {
    const orderId = locationState.orderId || queryOrderId;
    if (orderId) {
      const paymentCompleted = sessionStorage.getItem(`payment_${orderId}_completed`);
      if (paymentCompleted === 'true') {
        console.log(`Payment ${orderId} was already completed, redirecting to home`);
        dispatch(cancelPaymentPolling());
        toast.success("Payment was already completed successfully!");
        navigate('/', { replace: true });
      }
    }
  }, [locationState.orderId, queryOrderId, dispatch, navigate]);
  
  // Ưu tiên sử dụng location state trước, sau đó là query params
  useEffect(() => {
    const getStatusInfo = async () => {
      setIsVerifying(true);
      
      // Sử dụng thông tin từ URL hoặc state
      let finalStatus = locationState.status || queryStatus;
      const orderId = locationState.orderId || queryOrderId;
      const message = locationState.message || queryMessage;
      
      console.log('Initial payment status info:', { finalStatus, orderId, payosStatus });
      
      // Check if payment is already completed
      if (orderId) {
        const paymentCompleted = sessionStorage.getItem(`payment_${orderId}_completed`);
        if (paymentCompleted === 'true') {
          console.log(`Payment ${orderId} is already marked as completed`);
          finalStatus = 'paid';
          setIsVerifying(false);
          setPaymentResult({
            status: 'paid',
            orderId: orderId || '',
            message: "Payment was already completed successfully!"
          });
          return;
        }
      }
      
      // Đối với PayOS, chúng ta cần dịch trạng thái
      if (payosStatus === 'PAID' || payosStatus === 'SUCCESS' || payosStatus === '00') {
        console.log('PayOS status indicates payment success');
        finalStatus = 'paid';
        
        // Mark the payment as completed in session storage
        if (orderId) {
          sessionStorage.setItem(`payment_${orderId}_completed`, 'true');
        }
      } else if (payosStatus === 'CANCELLED' || payosStatus === 'FAILED') {
        console.log('PayOS status indicates payment failure');
        finalStatus = 'failed';
      }
      
      // Nếu có orderId nhưng không có status rõ ràng, kiểm tra với API
      if (orderId && (!finalStatus || finalStatus === 'pending')) {
        console.log('Need to verify payment status with API for order:', orderId);
        try {
          if (token) {
            const resultAction = await dispatch(checkPaymentStatus(orderId));
            if (checkPaymentStatus.fulfilled.match(resultAction)) {
              const data = resultAction.payload;
              const paymentStatus = data?.payment?.status;
              
              console.log('API payment status check result:', paymentStatus);
              
              // Chỉ dựa vào trạng thái thanh toán
              if (paymentStatus === 'paid') {
                finalStatus = 'paid';
                // Mark as completed
                sessionStorage.setItem(`payment_${orderId}_completed`, 'true');
              } else if (paymentStatus === 'failed') {
                finalStatus = 'failed';
              }
            } else {
              console.error('Failed to check payment status:', resultAction.error);
            }
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
        }
      }
      
      console.log('Final payment status determined:', finalStatus);
      
      // Set final result
      setPaymentResult({
        status: finalStatus || 'unknown',
        orderId: orderId || '',
        message: message || ''
      });
      
      setIsVerifying(false);
    };
    
    getStatusInfo();
    
    // Reset payment state in Redux
    dispatch(resetPayment());
  }, [dispatch, locationState, queryStatus, queryOrderId, queryMessage, payosStatus, token]);

  // Stop any polling immediately when landing on this page
  useEffect(() => {
    console.log('Payment result page loaded, ensuring all polling is stopped');
    dispatch(cancelPaymentPolling());
    
    // Mark this payment as completed in sessionStorage
    const orderId = locationState.orderId || queryOrderId;
    if (orderId && paymentResult.status === 'paid') {
      console.log(`Marking payment ${orderId} as completed`);
      sessionStorage.setItem(`payment_${orderId}_completed`, 'true');
    }
  }, [dispatch, locationState.orderId, queryOrderId, paymentResult.status]);
  
  // Show toast and start countdown after verification
  useEffect(() => {
    if (isVerifying) return;
    
    // Show toast based on status
    if (paymentResult.status === 'paid') {
      toast.success('Thanh toán thành công!');
    } else if (paymentResult.status === 'failed') {
      toast.error('Thanh toán thất bại!');
    } else {
      toast.error(paymentResult.message || 'Đã xảy ra lỗi trong quá trình thanh toán.');
    }
    
    let timer;
    // Start countdown to redirect to home
    if (countDown > 0) {
      timer = setInterval(() => {
        setCountDown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Cleanup function to clear the timer when component unmounts
    return () => {
      if (timer) {
        console.log('Clearing redirect timer');
        clearInterval(timer);
      }
    };
  }, [isVerifying, paymentResult, navigate, countDown]);
  
  // Add another effect to force navigation when leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force cancel any pending operations
      dispatch(resetPayment());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      dispatch(resetPayment());
    };
  }, [dispatch]);
  
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 4, md: 6 }, 
            borderRadius: 2,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}
        >
          {isVerifying ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3, color: '#0F52BA' }} />
              <Typography variant="h5" fontWeight={600}>
                Đang xác minh thanh toán...
              </Typography>
            </Box>
          ) : paymentResult.status === 'paid' ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <CheckCircleOutlineIcon 
                sx={{ 
                  fontSize: 100, 
                  color: '#4CAF50',
                  mb: 2
                }} 
              />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Thanh toán thành công!
              </Typography>
              {paymentResult.orderId && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Mã đơn hàng:
                  </Typography>
                  <Typography variant="h6" fontWeight={600} sx={{ color: '#0F52BA' }}>
                    {paymentResult.orderId}
                  </Typography>
                </Box>
              )}
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 2,
                maxWidth: 400,
                mx: 'auto',
                mb: 4
              }}>
                <Typography variant="body1">
                  Cảm ơn bạn đã mua hàng! Đơn hàng của bạn đã được xử lý thành công.
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <CancelOutlinedIcon 
                sx={{ 
                  fontSize: 100, 
                  color: '#F44336',
                  mb: 2
                }} 
              />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Thanh toán thất bại!
              </Typography>
              {paymentResult.message && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    {paymentResult.message}
                  </Typography>
                </Box>
              )}
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'rgba(244, 67, 54, 0.1)', 
                borderRadius: 2,
                maxWidth: 400,
                mx: 'auto',
                mb: 4
              }}>
                <Typography variant="body1">
                  Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ khách hàng.
                </Typography>
              </Box>
            </motion.div>
          )}
          
          <Divider sx={{ my: 3 }} />
          
          {!isVerifying && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
              <CircularProgress 
                variant="determinate" 
                value={(countDown / 5) * 100} 
                size={24} 
                sx={{ mr: 2, color: '#0F52BA' }} 
              />
              <Typography variant="body1" color="text.secondary">
                Bạn sẽ được chuyển đến trang chủ trong <strong>{countDown}</strong> giây
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{ 
                backgroundColor: '#0F52BA',
                '&:hover': {
                  backgroundColor: '#0A3C8A',
                },
                px: 3,
                py: 1.2
              }}
            >
              Về trang chủ
            </Button>
            
            {paymentResult.status === 'paid' && (
              <Button
                variant="outlined"
                startIcon={<ReceiptLongIcon />}
                component={Link}
                to="/order-history"
                sx={{ 
                  borderColor: '#0F52BA',
                  color: '#0F52BA',
                  '&:hover': {
                    borderColor: '#0A3C8A',
                    backgroundColor: 'rgba(15, 82, 186, 0.04)',
                  },
                  px: 3,
                  py: 1.2
                }}
              >
                Xem đơn hàng
              </Button>
            )}
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default PaymentResult; 