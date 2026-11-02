import { API_ORIGIN } from '../../utils/apiUrl';
import { productImageFallback } from '../../utils/productImage';
import { resolveProductImage } from '../../utils/productImage';
import { formatVND } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  Divider, 
  Button, 
  Card, 
  CardContent, 
  Rating, 
  Avatar, 
  Chip, 
  Tabs, 
  Tab, 
  Paper, 
  CircularProgress,
  TextField,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Skeleton,
  Stack,
  Fade,
  Zoom
} from '@mui/material';
import { 
  AddShoppingCart, 
  Store, 
  Inventory, 
  LocalShipping,
  LocalOffer,
  Description,
  Reviews,
  Reply,
  Send,
  Chat,
  ShoppingBag,
  Star,
  Favorite,
  FavoriteBorder,
  Share
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

import { startConversation } from '../../features/chat/chatSlice';

// Enhanced styled components for better UI
const StyledRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: '#FF8C00',
  },
  '& .MuiRating-iconHover': {
    color: '#FFB347',
  }
});

const ProductImage = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 16,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '450px',
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
  backgroundColor: '#ffffff',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
    transform: 'translateY(-5px)'
  }
}));

const PriceTag = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
  fontSize: '2rem',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'inline-block',
  position: 'relative',
  padding: theme.spacing(1, 2),
  borderRadius: '8px',
  backgroundColor: 'rgba(15, 82, 186, 0.05)'
}));

const ActionButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 4),
  borderRadius: 12,
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  }
}));

const ReviewCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  marginBottom: theme.spacing(2),
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  transition: 'transform 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    transform: 'translateY(-2px)'
  }
}));

const InfoCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  height: '100%',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    transform: 'translateY(-4px)'
  }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  minWidth: 100,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  }
}));

const AuthProductDetail = () => {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get initial product data from navigation state if available
  const initialProductData = location.state?.item || null;
  
  const [product, setProduct] = useState(initialProductData);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Get authentication info from Redux store
  const authState = useSelector(state => state.auth);
  const isAuthenticated = authState?.isAuthenticated || false;
  const user = authState?.user || null;
  const token = authState?.token || null;
  
  const API_BASE_URL = API_ORIGIN;
  
  const dispatch = useDispatch();
  
  // Fetch detailed product information
  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE_URL}/api/products/${productId}/detail`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setProduct(response.data.data);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error(error.response?.data?.message || 'Failed to load product details');
      
      // Redirect to home if product not found or not authorized
      if (error.response?.status === 404 || error.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { fetchProductDetail(); }, [productId]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle reply
  const handleReplyClick = (reviewId) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to reply');
      return;
    }
    
    setReplyingTo(replyingTo === reviewId ? null : reviewId);
    setReplyText('');
  };
  
  // Submit reply
  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) {
      toast.warning('Reply cannot be empty');
      return;
    }
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/products/${productId}/reviews/${reviewId}/reply`,
        { comment: replyText },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      toast.success('Reply posted successfully');
      setReplyText('');
      setReplyingTo(null);
      
      // Refresh product details to show the new reply
      fetchProductDetail();
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error(error.response?.data?.message || 'Failed to post reply');
    }
  };
  
  // Add product to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add products to cart');
      navigate('/signin');
      return;
    }
    
    // Prevent seller from adding their own product
    if (user?.role === 'seller' && product?.product?.sellerId?._id === user.id) {
      toast.warning('You cannot add your own products to cart');
      return;
    }
    
    try {
      setAddingToCart(true);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/buyers/cart/add`,
        { productId: product.product._id, quantity: 1 },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      toast.success('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you would implement API call to save favorite status
    toast.info(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };
  
  // Handle Chat with Seller
  const handleChatWithSeller = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to chat with the seller');
      navigate('/signin');
      return;
    }
    
    // Cannot chat with yourself
    if (user?.id === product.product.sellerId?._id) {
      toast.warning('This is your own product');
      return;
    }
    
    if (!product.product.sellerId?._id) {
      toast.error('Seller information not available');
      return;
    }
    
    // Get product image URL
    const imageUrl = product.product.image ? resolveProductImage(product.product.image, API_BASE_URL) : null;
    
    // Start conversation with seller
    dispatch(startConversation(product.product.sellerId._id))
      .unwrap()
      .then(async (result) => {
        // Create a concise message with essential product information
        const productPrice = product.product.price ? formatVND(product.product.price) : '';
        
        // Prepare simple product information with just name and price
        const productInfo = `I'm interested in: ${product.product.title} ${productPrice ? `(${productPrice})` : ''}`;
        
        // Prepare image data if available
        const imageData = imageUrl ? {
          url: imageUrl,
          secure_url: imageUrl,
          public_id: `product-${product.product._id}`
        } : null;
        
        // Send message directly using socketService
        const { sendMessage } = require('../../services/socketService');
        
        // Create the message data
        const messageData = {
          content: productInfo,
          recipientId: product.product.sellerId._id,
          conversationId: result._id
        };
        
        await sendMessage(messageData);
        
        // Mark as sent to prevent duplicate sending
        sessionStorage.setItem(`sentInitialMessage_${result._id}`, 'true');
        
        // Navigate to chat page without initial message data
        navigate('/chat', { 
          state: { 
            conversationId: result._id
          } 
        });
        
        toast.success('Product information sent to the seller');
      })
      .catch((error) => {
        console.error('Error starting conversation:', error);
        toast.error('Failed to start chat with seller');
      });
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={6}>
          {/* Product Image Skeleton */}
          <Grid item xs={12} md={5}>
            <Skeleton variant="rectangular" height={450} animation="wave" sx={{ borderRadius: 4 }} />
          </Grid>
          
          {/* Product Info Skeleton */}
          <Grid item xs={12} md={7}>
            <Skeleton variant="text" height={60} width="80%" animation="wave" />
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Skeleton variant="text" width={150} height={30} animation="wave" />
            </Box>
            <Skeleton variant="text" height={50} width="40%" animation="wave" sx={{ mt: 3 }} />
            <Skeleton variant="text" height={24} width="100%" animation="wave" sx={{ mt: 3 }} />
            <Skeleton variant="text" height={24} width="100%" animation="wave" />
            <Skeleton variant="text" height={24} width="60%" animation="wave" />
            <Box sx={{ mt: 4 }}>
              <Skeleton variant="text" height={30} width="40%" animation="wave" />
              <Skeleton variant="rectangular" height={60} width="70%" animation="wave" sx={{ mt: 2, borderRadius: 3 }} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    );
  }
  
  if (!product || !product.product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h5" color="error">
            Product not found or could not be loaded
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
            sx={{ mt: 3, borderRadius: 8, textTransform: 'none', px: 4 }}
          >
            Return to Home
          </Button>
        </Paper>
      </Container>
    );
  }
  
  const { product: productData, store, inventory, reviews, averageRating, totalReviews } = product;
  
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={6}>
        {/* Product Image */}
        <Grid item xs={12} md={5}>
          <Fade in={true} timeout={800}>
            <ProductImage>
              <Box
                component="img"
                sx={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
                src={resolveProductImage(productData.image, API_BASE_URL)}
                alt={productData.title}
                onError={productImageFallback}
              />
            </ProductImage>
          </Fade>
        </Grid>
        
        {/* Product Info */}
        <Grid item xs={12} md={7}>
          <Box>
            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Typography variant="h3" fontWeight={700} sx={{ mb: 2, color: '#333' }}>
                {productData.title}
              </Typography>
            </Zoom>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <StyledRating value={averageRating} precision={0.5} readOnly size="medium" />
              <Typography variant="body1" sx={{ ml: 1, color: 'text.secondary', fontWeight: 500 }}>
                ({totalReviews} reviews)
              </Typography>
            </Box>
            
            <PriceTag>
              {formatVND(productData.price)}
            </PriceTag>
            
            {/* Category */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <Chip 
                label={productData.categoryId?.name || "Uncategorized"} 
                size="medium" 
                sx={{ 
                  backgroundColor: 'rgba(15, 82, 186, 0.1)', 
                  color: '#0F52BA',
                  fontWeight: 600,
                  mr: 1,
                  borderRadius: '12px',
                  px: 1.5,
                  py: 2.5
                }} 
                icon={<LocalOffer fontSize="small" />}
              />
            </Box>
            
            {/* Description - shortened version */}
            <Typography variant="body1" sx={{ mt: 3, color: '#555', lineHeight: 1.7 }}>
              {productData.description.length > 150 
                ? `${productData.description.substring(0, 150)}...` 
                : productData.description}
            </Typography>
            
            {/* Stock Status */}
            <Box sx={{ mt: 4, p: 2, borderRadius: 3, bgcolor: 'rgba(0, 0, 0, 0.02)', display: 'flex', alignItems: 'center' }}>
              <Inventory sx={{ color: inventory?.quantity > 0 ? 'success.main' : 'error.main', mr: 1.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Stock Status: 
                  <Chip 
                    label={inventory?.quantity > 0 ? 'In Stock' : 'Out of Stock'} 
                    color={inventory?.quantity > 0 ? 'success' : 'error'}
                    size="small"
                    sx={{ ml: 1, fontWeight: 600, borderRadius: '10px' }}
                  />
                </Typography>
                
                {inventory?.quantity > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {inventory.quantity} items available
                  </Typography>
                )}
              </Box>
            </Box>
            
            {/* Seller Information */}
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', bgcolor: 'rgba(15, 82, 186, 0.04)', p: 1.5, borderRadius: 2 }}>
              <Avatar 
                src={productData.sellerId?.avatarURL}
                sx={{ width: 36, height: 36, mr: 1.5 }}
              />
              <Typography variant="body2">
                Sold by: <Typography component="span" fontWeight={700} color="primary">
                  {store?.storeName || productData.sellerId?.username || 'Unknown Seller'}
                </Typography>
              </Typography>
            </Box>
            
            {/* Add to Cart Button and Chat with Seller */}
            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <ActionButton
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddShoppingCart />}
                onClick={handleAddToCart}
                disabled={addingToCart || inventory?.quantity <= 0 || (user?.role === 'seller' && productData.sellerId?._id === user.id)}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </ActionButton>
              
              <ActionButton
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<Chat />}
                onClick={handleChatWithSeller}
                disabled={user?.id === productData.sellerId?._id}
              >
                Chat with Seller
              </ActionButton>
              
              <IconButton 
                color="default" 
                sx={{ 
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: 3,
                  p: 1.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
                onClick={handleToggleFavorite}
              >
                {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
              </IconButton>
            </Stack>
          </Box>
        </Grid>
      </Grid>
      
      {/* Tabs: Description, Reviews, Seller Info */}
      <Box sx={{ mt: 8 }}>
        <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', mb: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            textColor="primary"
            indicatorColor="primary"
            centered
            variant="fullWidth"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              bgcolor: '#f8f9fa',
            }}
          >
            <StyledTab label="Description" icon={<Description />} iconPosition="start" />
            <StyledTab label={`Reviews (${totalReviews})`} icon={<Star />} iconPosition="start" />
            <StyledTab label="Seller Information" icon={<Store />} iconPosition="start" />
          </Tabs>
          
          {/* Description Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#444' }}>
              {productData.description || 'No description available.'}
            </Typography>
          </TabPanel>
          
          {/* Reviews Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start' }}>
              <Paper sx={{ 
                p: 4, 
                borderRadius: 3, 
                bgcolor: 'rgba(15, 82, 186, 0.05)', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 180,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
              }}>
                <Typography variant="h2" color="primary" fontWeight={700} sx={{ mb: 1 }}>
                  {averageRating.toFixed(1)}
                </Typography>
                <StyledRating value={averageRating} precision={0.5} readOnly size="large" />
                <Typography variant="body1" sx={{ mt: 2, fontWeight: 500 }}>
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </Typography>
              </Paper>
              
              <Box sx={{ ml: 4, flex: 1 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Rating Breakdown
                </Typography>
                {[5, 4, 3, 2, 1].map((rating) => {
                  // Calculate how many reviews have this rating
                  const ratingCount = reviews.filter(review => Math.round(review.rating) === rating).length;
                  // Calculate percentage of total reviews
                  const percentage = totalReviews > 0 ? (ratingCount / totalReviews) * 100 : 0;
                  
                  return (
                    <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ mr: 1, minWidth: 20 }}>
                        {rating}
                      </Typography>
                      <Star sx={{ color: '#FFB347', mr: 1, fontSize: 16 }} />
                      <Box sx={{ 
                        flex: 1, 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'rgba(0,0,0,0.08)',
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: `${percentage}%`,
                          height: '100%',
                          bgcolor: '#FFB347'
                        }} />
                      </Box>
                      <Typography variant="body2" sx={{ ml: 1, minWidth: 40 }}>
                        {ratingCount} ({percentage.toFixed(0)}%)
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
            
            {reviews && reviews.length > 0 ? (
              <List sx={{ mt: 2 }}>
                {reviews.map((review) => (
                  <Box key={review._id} sx={{ mb: 3 }}>
                    <ReviewCard>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar 
                          src={review.reviewerId?.avatarURL} 
                          alt={review.reviewerId?.username}
                          sx={{ width: 56, height: 56 }}
                        />
                        <Box sx={{ ml: 2, width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight={600}>
                              {review.reviewerId?.fullname || review.reviewerId?.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(review.createdAt)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                            <StyledRating value={review.rating} readOnly size="small" />
                            <Chip 
                              label={`${review.rating}/5`} 
                              size="small" 
                              sx={{ 
                                ml: 1, 
                                bgcolor: 'rgba(255, 183, 77, 0.1)',
                                color: '#FF8C00',
                                height: 24
                              }} 
                            />
                          </Box>
                          
                          <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#333' }}>
                            {review.comment}
                          </Typography>
                          
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              startIcon={<Reply />}
                              color="primary"
                              size="small"
                              onClick={() => handleReplyClick(review._id)}
                              sx={{ textTransform: 'none', fontWeight: 500 }}
                            >
                              Reply
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                      
                      {replyingTo === review._id && (
                        <Box sx={{ mt: 2, ml: 7, display: 'flex', alignItems: 'flex-start' }}>
                          <Avatar 
                            src={user?.avatarURL} 
                            sx={{ width: 36, height: 36, mr: 2 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              maxRows={4}
                              placeholder="Write your reply here..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              variant="outlined"
                              sx={{ 
                                '& .MuiOutlinedInput-root': { 
                                  borderRadius: 2,
                                  bgcolor: 'rgba(0,0,0,0.02)'
                                }
                              }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                              <Button
                                variant="text"
                                color="inherit"
                                size="small"
                                onClick={() => setReplyingTo(null)}
                                sx={{ mr: 1, textTransform: 'none' }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                endIcon={<Send />}
                                onClick={() => handleSubmitReply(review._id)}
                                disabled={!replyText.trim()}
                                sx={{ textTransform: 'none', borderRadius: 6, px: 2 }}
                              >
                                Submit Reply
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </ReviewCard>
                    
                    {/* Replies */}
                    {review.replies && review.replies.length > 0 && (
                      <Box sx={{ ml: 6, mt: 1 }}>
                        {review.replies.map(reply => (
                          <Paper 
                            key={reply._id} 
                            elevation={0} 
                            sx={{ 
                              p: 2, 
                              mt: 1, 
                              borderRadius: 3, 
                              bgcolor: 'rgba(0, 0, 0, 0.02)',
                              border: '1px solid rgba(0, 0, 0, 0.05)'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <Avatar 
                                src={reply.reviewerId?.avatarURL} 
                                alt={reply.reviewerId?.username}
                                sx={{ width: 32, height: 32 }}
                              />
                              <Box sx={{ ml: 1.5, width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {reply.reviewerId?.fullname || reply.reviewerId?.username}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(reply.createdAt)}
                                  </Typography>
                                </Box>
                                
                                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                  {reply.comment}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                  No reviews available for this product.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Be the first to review this product!
                </Typography>
              </Box>
            )}
          </TabPanel>
          
          {/* Seller Information Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <InfoCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Store sx={{ fontSize: 28, color: 'primary.main', mr: 1.5 }} />
                      <Typography variant="h5" fontWeight={600}>
                        Store Information
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    
                    {store ? (
                      <>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                          {store.storeName}
                        </Typography>
                        
                        {store.bannerImageURL && (
                          <Box 
                            component="img"
                            sx={{
                              width: '100%',
                              height: '140px',
                              objectFit: 'cover',
                              borderRadius: 2,
                              mb: 2
                            }}
                            src={store.bannerImageURL.startsWith('http') ? 
                              store.bannerImageURL : 
                              `${API_BASE_URL}/uploads/${store.bannerImageURL}`
                            }
                            alt={store.storeName}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/400x150?text=No+Image';
                            }}
                          />
                        )}
                        
                        <Typography variant="body1" sx={{ mt: 2, mb: 3, lineHeight: 1.7, color: '#555' }}>
                          {store.description || 'No store description available.'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight={500} sx={{ mr: 1 }}>
                            Store status:
                          </Typography>
                          <Chip size="small" label={store.status.toUpperCase()} color={
                            store.status === 'approved' ? 'success' : 
                            store.status === 'rejected' ? 'error' : 'warning'
                          } sx={{ fontWeight: 600 }} />
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        Store information not available
                      </Typography>
                    )}
                  </CardContent>
                </InfoCard>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <InfoCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ShoppingBag sx={{ fontSize: 28, color: 'primary.main', mr: 1.5 }} />
                      <Typography variant="h5" fontWeight={600}>
                        Seller Information
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    
                    {productData.sellerId ? (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={productData.sellerId.avatarURL} 
                            alt={productData.sellerId.username}
                            sx={{ width: 80, height: 80 }}
                          />
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="h6" fontWeight={600}>
                              {productData.sellerId.fullname || productData.sellerId.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Member since: {formatDate(productData.sellerId.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ 
                          mt: 3, 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'rgba(0,0,0,0.02)',
                          border: '1px solid rgba(0,0,0,0.05)'
                        }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                            Contact Information
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            Email: <Box component="span" sx={{ ml: 1, fontWeight: 500 }}>{productData.sellerId.email}</Box>
                          </Typography>
                        </Box>
                        
                        <Button
                          variant="outlined"
                          color="primary"
                          fullWidth
                          startIcon={<Chat />}
                          sx={{ mt: 3, borderRadius: 8, textTransform: 'none', py: 1.2 }}
                          onClick={handleChatWithSeller}
                          disabled={user?.id === productData.sellerId?._id}
                        >
                          Contact Seller
                        </Button>
                      </>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        Seller information not available
                      </Typography>
                    )}
                  </CardContent>
                </InfoCard>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      {...other}
      style={{ padding: '32px' }}
    >
      {value === index && (
        <Fade in={true} timeout={500}>
          <Box>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
}

export default AuthProductDetail; 