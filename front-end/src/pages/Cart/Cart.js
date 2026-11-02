import { resolveProductImage } from '../../utils/productImage';
import { formatVND } from '../../utils/currency';
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { 
  fetchCart,
  updateCartItem,
  removeCartItem,
  resetCart,
  removeSelectedItems
} from "../../features/cart/cartSlice";
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button, 
  Divider, 
  Checkbox,
  CircularProgress,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Alert,
  Fade
} from "@mui/material";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { token } = useSelector((state) => state.auth) || {};
  const { items: cartItems, loading, error } = useSelector((state) => state.cart);
  
  const [totalAmt, setTotalAmt] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch cart on mount and when token changes
  useEffect(() => {
    if (token) {
      dispatch(fetchCart());
    } else {
      navigate('/signin');
      toast.info('Please login to view your cart');
    }
  }, [dispatch, token, navigate]);

  // Calculate total amount for selected items
  useEffect(() => {
    let price = 0;
    cartItems.forEach((item) => {
      if (selectedItems.includes(item.productId._id)) {
        if (item.productId && item.productId.price) {
          price += item.productId.price * item.quantity;
        }
      }
    });
    setTotalAmt(price);
  }, [cartItems, selectedItems]);

  // Handle select/deselect all
  useEffect(() => {
    if (selectAll && cartItems.length > 0) {
      const allItemIds = cartItems.map(item => item.productId._id);
      setSelectedItems(allItemIds);
    } else if (!selectAll) {
      setSelectedItems([]);
    }
  }, [selectAll, cartItems]);

  // Handle reset cart
  const handleResetCart = () => {
    if (window.confirm('Are you sure you want to reset your cart?')) {
      dispatch(resetCart());
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  // Handle remove selected items
  const handleRemoveSelected = () => {
    if (selectedItems.length === 0) {
      toast.warn('No items selected');
      return;
    }
    
    setIsProcessing(true);
    dispatch(removeSelectedItems(selectedItems))
      .then(() => {
        setSelectedItems([]);
        setSelectAll(false);
        toast.success('Selected items removed');
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  // Handle update quantity
  const handleUpdateQuantity = (productId, quantity) => {
    // Get the cart item
    const item = cartItems.find(item => item.productId._id === productId);
    
    // Check if item exists and has inventory data
    if (item && item.productId && item.productId.inventoryQuantity !== undefined) {
      // Check if requested quantity exceeds inventory
      if (quantity > item.productId.inventoryQuantity) {
        toast.warning(`Cannot add more than ${item.productId.inventoryQuantity} items (available in stock)`);
        return;
      }
    }
    
    dispatch(updateCartItem({ productId, quantity }));
  };

  // Handle remove item
  const handleRemoveItem = (productId) => {
    dispatch(removeCartItem(productId));
    setSelectedItems(prev => prev.filter(id => id !== productId));
  };

  // Toggle item selection
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Proceed to checkout
  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select products to checkout");
      return;
    }
    navigate("/checkout", { state: { selectedItems } });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress sx={{ color: '#0F52BA' }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

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
          Shopping Cart
        </Typography>
        
        {cartItems.length > 0 ? (
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  mb: { xs: 3, md: 0 },
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={selectAll}
                      onChange={() => setSelectAll(!selectAll)}
                      sx={{ color: '#0F52BA', '&.Mui-checked': { color: '#0F52BA' } }}
                    />
                    <Typography variant="body1" fontWeight={500}>
                      Select All ({cartItems.length} items)
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    startIcon={<DeleteSweepIcon />}
                    onClick={handleResetCart}
                    size="small"
                    color="error"
                  >
                    Clear Cart
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {cartItems.map((item) => (
                  <Fade key={item.productId?._id || Math.random()} in={true}>
                    <Card 
                      sx={{ 
                        mb: 2, 
                        display: 'flex', 
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'visible',
                        boxShadow: 'none',
                        border: '1px solid #eee'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
                        <Checkbox
                          checked={selectedItems.includes(item.productId._id)}
                          onChange={() => toggleItemSelection(item.productId._id)}
                          sx={{ color: '#0F52BA', '&.Mui-checked': { color: '#0F52BA' } }}
                        />
                      </Box>
                      
                      <Box 
                        sx={{ 
                          width: 100, 
                          height: 100, 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 1
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={resolveProductImage(item.productId?.image)}
                          alt={item.productId?.name || "Product"}
                          sx={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </Box>
                      
                      <CardContent sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                            {item.productId?.title || item.productId?.name || "Product Name"}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Unit Price: {formatVND(item.productId?.price)}
                          </Typography>
                          
                          {item.productId.inventoryQuantity !== undefined && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Available: {item.productId.inventoryQuantity} in stock
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => item.quantity > 1 && handleUpdateQuantity(item.productId._id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              sx={{ 
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px 0 0 4px',
                                p: 0.5
                              }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            
                            <Box 
                              sx={{ 
                                px: 2, 
                                py: 0.5, 
                                minWidth: 40, 
                                textAlign: 'center',
                                border: '1px solid #e0e0e0',
                                borderLeft: 0,
                                borderRight: 0
                              }}
                            >
                              {item.quantity}
                            </Box>
                            
                            <IconButton 
                              size="small" 
                              onClick={() => handleUpdateQuantity(item.productId._id, item.quantity + 1)}
                              disabled={item.quantity >= (item.productId.inventoryQuantity || 0)}
                              sx={{ 
                                border: '1px solid #e0e0e0',
                                borderRadius: '0 4px 4px 0',
                                p: 0.5,
                                '&.Mui-disabled': {
                                  backgroundColor: '#f5f5f5',
                                  color: 'rgba(0, 0, 0, 0.26)'
                                }
                              }}
                              title={item.quantity >= (item.productId.inventoryQuantity || 0) ? 
                                "Maximum available quantity reached" : ""}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          
                          <Typography variant="subtitle1" fontWeight={600} color="#0F52BA">
                            {formatVND((item.quantity * (item.productId?.price || 0)))}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveItem(item.productId._id)}
                        sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          color: '#d32f2f'
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  </Fade>
                ))}
                
                {selectedItems.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleRemoveSelected}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Removing...' : `Remove Selected (${selectedItems.length})`}
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
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
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Selected Items:</Typography>
                    <Typography variant="body1">{selectedItems.length}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1">{formatVND(totalAmt)}</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>Total:</Typography>
                    <Typography variant="h6" fontWeight={700} color="#0F52BA">
                      {formatVND(totalAmt)}
                    </Typography>
                  </Box>
                </Box>
                
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleProceedToCheckout}
                  disabled={selectedItems.length === 0}
                  sx={{ 
                    py: 1.5,
                    backgroundColor: '#0F52BA',
                    '&:hover': {
                      backgroundColor: '#0A3C8A',
                    },
                    fontWeight: 600
                  }}
                >
                  Proceed to Checkout
                </Button>
                
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Link to="/" style={{ textDecoration: 'none' }}>
                    <Button
                      startIcon={<ShoppingBagIcon />}
                      sx={{ 
                        color: '#0F52BA',
                        '&:hover': {
                          backgroundColor: 'rgba(15, 82, 186, 0.04)',
                        }
                      }}
                    >
                      Continue Shopping
                    </Button>
                  </Link>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 6, 
              textAlign: 'center',
              borderRadius: 2,
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 80, color: '#0F52BA', opacity: 0.3, mb: 2 }} />
              
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Your Cart is Empty
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                Your shopping cart lives to serve. Give it purpose - fill it with products, electronics, clothes, and more!
              </Typography>
              
              <Button
                variant="contained"
                component={Link}
                to="/"
                startIcon={<ShoppingBagIcon />}
                sx={{ 
                  px: 4,
                  py: 1.2,
                  backgroundColor: '#0F52BA',
                  '&:hover': {
                    backgroundColor: '#0A3C8A',
                  }
                }}
              >
                Start Shopping
              </Button>
            </motion.div>
          </Paper>
        )}
      </motion.div>
    </Container>
  );
};

export default Cart;