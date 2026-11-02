import { resolveProductImage } from '../../utils/productImage';
import { formatVND } from '../../utils/currency';
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Modal from "react-modal";
import { fetchAddresses, addAddress } from "../../features/address/addressSlice";
import { applyVoucher, clearVoucher } from "../../features/voucher/voucherSlice";
import { createOrder } from "../../features/order/orderSlice";
import { removeSelectedItems } from "../../features/cart/cartSlice";
import { motion } from "framer-motion";
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  Button, 
  TextField, 
  Divider, 
  Chip,
  CircularProgress,
  FormControl,
  Checkbox
} from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import DiscountIcon from '@mui/icons-material/Discount';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Custom modal styles
const customModalStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    position: 'relative',
    top: 'auto',
    left: 'auto',
    right: 'auto',
    bottom: 'auto',
    maxWidth: '500px',
    width: '100%',
    padding: '0',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    backgroundColor: 'white',
    overflow: 'hidden'
  }
};

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get data from the Redux store
  const { token } = useSelector((state) => state.auth) || {};
  const cartItems = useSelector((state) => state.cart?.items || []);
  const addresses = useSelector((state) => state.address?.addresses || []);
  const { voucher, loading: voucherLoading, error: voucherError } = useSelector((state) => state.voucher);

  // State for selected products
  const selectedItems = location.state?.selectedItems || [];
  const selectedProducts = cartItems.filter(item =>
    item.productId && selectedItems.includes(item.productId._id)
  );

  // State for checkout options
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    isDefault: false,
  });
  const [phoneError, setPhoneError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const submitting = useRef(false);
  
  // Removed payment method state

  // Fetch addresses on component mount and clear voucher on unmount
  useEffect(() => {
    if (token) {
      dispatch(fetchAddresses());
    }
    return () => {
      dispatch(clearVoucher());
    };
  }, [dispatch, token]);

  // Set default address if available
  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddress = addresses.find(address => address.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
      } else {
        setSelectedAddressId(addresses[0]._id);
      }
    }
  }, [addresses]);

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    const regex = /^0\d{9}$/;
    return regex.test(phone);
  };

  // Calculate subtotal
  const subtotal = selectedProducts.reduce((total, item) => {
    return total + (item.productId?.price || 0) * item.quantity;
  }, 0);

  // Calculate discount from the applied voucher
  const calculateDiscount = () => {
    if (!voucher) return 0;
    if (subtotal < voucher.minOrderValue) {
      if (voucherError === null) {
        toast.error(`Order must have a minimum value of ${formatVND(voucher.minOrderValue)} to apply this code.`);
        dispatch(clearVoucher());
      }
      return 0;
    }
    if (voucher.discountType === 'fixed') {
      return voucher.discount;
    } else if (voucher.discountType === 'percentage') {
      const calculatedDiscount = (subtotal * voucher.discount) / 100;
      return voucher.maxDiscount > 0 ? Math.min(calculatedDiscount, voucher.maxDiscount) : calculatedDiscount;
    }
    return 0;
  };

  const discount = calculateDiscount();
  const total = Math.max(subtotal - discount, 0);

  // Handle adding a new address
  const handleAddAddress = () => {
    if (!validatePhoneNumber(newAddress.phone)) {
      setPhoneError("Invalid phone number. Must start with 0 and contain exactly 10 digits.");
      return;
    }
    setPhoneError("");
    dispatch(addAddress(newAddress));
    setIsAddressModalOpen(false);
    setNewAddress({
      fullName: "", phone: "", street: "", city: "", state: "", country: "", isDefault: false,
    });
  };

  // Handle applying the coupon code
  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      dispatch(applyVoucher(couponCode));
    } else {
      toast.error("Please enter a coupon code");
    }
  };

  // Handle canceling the applied voucher
  const handleCancelVoucher = () => {
    dispatch(clearVoucher());
    setCouponCode("");
    toast.info("Coupon code removed.");
  };

  // Handle placing the order, removing the paymentMethod
  const handlePlaceOrder = async () => {
    if (submitting.current) return;
    if (!selectedProducts.length || selectedProducts.some(item => !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
      toast.error('Giỏ hàng cần có sản phẩm với số lượng nguyên dương.');
      return;
    }
    if (!selectedAddressId) {
      toast.error("Please select a shipping address");
      return;
    }
    
    submitting.current = true;
    setIsProcessing(true);
    
    const orderDetails = { 
      selectedItems: selectedProducts.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity
      })), 
      selectedAddressId, 
      couponCode: voucher ? voucher.code : ''
    };

    try {
      console.log("Submitting order with items:", orderDetails.selectedItems);
      const result = await dispatch(createOrder({ ...orderDetails, checkoutScope: location.key })).unwrap();
      
      // Get all product IDs to remove from cart
      const productIds = selectedProducts.map(item => item.productId._id);
      
      // Remove the items from cart in a single batch operation
      try { await dispatch(removeSelectedItems(productIds)).unwrap(); }
      catch { toast.info('Đơn đã tạo thành công; giỏ hàng chưa cập nhật. Bạn có thể dọn giỏ sau.'); }
      
      toast.success("Order placed successfully!");
      
      // Navigate to payment page with stringified orderId to ensure it passes correctly
      navigate("/payment", { 
        state: { 
          orderId: result.orderId.toString(), 
          totalPrice: result.totalPrice
        },
        replace: true  // Use replace to prevent back navigation issues
      });
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Không thể tạo đơn. Vui lòng thử lại.');
      submitting.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            color: '#0F52BA',
            position: 'relative',
            pb: 2,
            mb: 4,
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '60px',
              height: '4px',
              backgroundColor: '#0F52BA',
              borderRadius: '2px'
            }
          }}
        >
          <ShoppingCartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Checkout
        </Typography>
        
        <Grid container spacing={4}>
          {/* Left side: Shipping and coupon */}
          <Grid item xs={12} md={7}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                mb: 4, 
                borderRadius: 2,
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LocalShippingIcon sx={{ mr: 1, color: '#0F52BA' }} />
                <Typography variant="h5" fontWeight={600}>
                  Shipping Address
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {addresses.length > 0 ? (
                <RadioGroup
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                >
                  <Grid container spacing={2}>
                    {addresses.map((address) => (
                      <Grid item xs={12} sm={6} key={address._id}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            borderColor: selectedAddressId === address._id ? '#0F52BA' : 'divider',
                            backgroundColor: selectedAddressId === address._id ? 'rgba(15, 82, 186, 0.04)' : 'transparent',
                            position: 'relative',
                            transition: 'all 0.2s'
                          }}
                        >
                          {address.isDefault && (
                            <Chip 
                              label="Default" 
                              size="small" 
                              color="primary" 
                              sx={{ 
                                position: 'absolute', 
                                top: 8, 
                                right: 8,
                                backgroundColor: '#0F52BA'
                              }} 
                            />
                          )}
                          <FormControlLabel
                            value={address._id}
                            control={<Radio sx={{ color: '#0F52BA', '&.Mui-checked': { color: '#0F52BA' } }} />}
                            label={
                              <Box sx={{ ml: 1 }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {address.fullName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {address.phone}
                                </Typography>
                                <Typography variant="body2">
                                  {`${address.street}, ${address.city}, ${address.state}, ${address.country}`}
                                </Typography>
                              </Box>
                            }
                            sx={{ width: '100%', alignItems: 'flex-start', m: 0 }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  You don't have any addresses yet. Please add a new address.
                </Typography>
              )}
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setIsAddressModalOpen(true)}
                sx={{ 
                  mt: 3,
                  borderColor: '#0F52BA',
                  color: '#0F52BA',
                  '&:hover': {
                    borderColor: '#0A3C8A',
                    backgroundColor: 'rgba(15, 82, 186, 0.04)',
                  }
                }}
              >
                Add New Address
              </Button>
            </Paper>
            
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 2,
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DiscountIcon sx={{ mr: 1, color: '#0F52BA' }} />
                <Typography variant="h5" fontWeight={600}>
                  Discount Code
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {voucher ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                    <Typography variant="body1" fontWeight={500} color="success.main">
                      Applied: {voucher.code}
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={handleCancelVoucher}
                    sx={{ minWidth: 100 }}
                  >
                    Remove
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex' }}>
                  <TextField
                    fullWidth
                    placeholder="Enter discount code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Button 
                    variant="contained"
                    onClick={handleApplyCoupon}
                    disabled={voucherLoading || !couponCode.trim()}
                    sx={{ 
                      minWidth: 100,
                      backgroundColor: '#0F52BA',
                      '&:hover': {
                        backgroundColor: '#0A3C8A',
                      }
                    }}
                  >
                    {voucherLoading ? <CircularProgress size={24} color="inherit" /> : 'Apply'}
                  </Button>
                </Box>
              )}
              
              {voucherError && !voucher && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {voucherError}
                </Typography>
              )}
            </Paper>
            
            {/* Removed Payment Method section */}
          </Grid>
          
          {/* Right side: Order summary */}
          <Grid item xs={12} md={5}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 2,
                position: 'sticky',
                top: 24,
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="h5" fontWeight={600} mb={3}>
                Order Summary
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 3, pr: 1 }}>
                {selectedProducts.map(item => (
                  <Box 
                    key={item.productId?._id} 
                    sx={{ 
                      display: 'flex', 
                      mb: 2, 
                      pb: 2, 
                      borderBottom: '1px solid #eee' 
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 70, 
                        height: 70, 
                        flexShrink: 0, 
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        overflow: 'hidden',
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img 
                        src={resolveProductImage(item.productId?.image)} 
                        alt={item.productId?.title} 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain' 
                        }}
                      />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" fontWeight={500} noWrap>
                        {item.productId?.title || item.productId?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quantity: {item.quantity}
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={600} sx={{ ml: 2 }}>
                      {formatVND(((item.productId?.price || 0) * item.quantity))}
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">{formatVND(subtotal)}</Typography>
                </Box>
                
                {discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                    <Typography variant="body1">Discount:</Typography>
                    <Typography variant="body1">-{formatVND(discount)}</Typography>
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600}>Total:</Typography>
                  <Typography variant="h6" fontWeight={700} color="#0F52BA">
                    {formatVND(total)}
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handlePlaceOrder}
                disabled={isProcessing || selectedProducts.length === 0}
                sx={{ 
                  py: 1.5,
                  backgroundColor: '#0F52BA',
                  '&:hover': {
                    backgroundColor: '#0A3C8A',
                  },
                  fontWeight: 600
                }}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
              
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                backgroundColor: 'rgba(15, 82, 186, 0.04)', 
                borderRadius: 2,
                border: '1px dashed #0F52BA'
              }}>
                <Typography variant="body2" color="text.secondary">
                  Đơn hàng demo sử dụng COD mô phỏng. Kiểm tra sản phẩm, địa chỉ và số tiền trước khi đặt.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
      
      {/* Add new address modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onRequestClose={() => setIsAddressModalOpen(false)}
        style={customModalStyles}
        contentLabel="Add New Address"
        ariaHideApp={false}
      >
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} mb={3}>
            Add New Address
          </Typography>
          
          {phoneError && (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {phoneError}
            </Typography>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={newAddress.fullName}
                onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newAddress.phone}
                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={newAddress.street}
                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State/Province"
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Country"
                value={newAddress.country}
                onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    sx={{ color: '#0F52BA', '&.Mui-checked': { color: '#0F52BA' } }}
                  />
                }
                label="Set as default address"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setIsAddressModalOpen(false)}
              sx={{ 
                borderColor: 'grey.500',
                color: 'grey.700',
                '&:hover': {
                  borderColor: 'grey.700',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddAddress}
              sx={{ 
                backgroundColor: '#0F52BA',
                '&:hover': {
                  backgroundColor: '#0A3C8A',
                }
              }}
            >
              Save Address
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
};

export default Checkout;