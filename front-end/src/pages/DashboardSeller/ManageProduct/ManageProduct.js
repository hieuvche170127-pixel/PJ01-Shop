import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import Products from './Products';
import AddProduct from './AddProduct';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../../services/index';
import InventoryIcon from '@mui/icons-material/Inventory';

export default function ManageProduct() {
  const theme = useTheme();
  const { handleSetDashboardTitle } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set the dashboard title
  useEffect(() => {
    handleSetDashboardTitle("Manage Products");
  }, [handleSetDashboardTitle]);

  // Fetch products after adding a new one or updating
  const updateProductList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("seller/products");
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching product list:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch of products
    updateProductList();
  }, []);

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
          Product Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your products inventory, pricing, and details
        </Typography>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 0, 
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          mb: 2
        }}
      >
        {loading ? (
          <Box sx={{ 
            py: 8, 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress />
            <Typography color="text.secondary">
              Loading products...
            </Typography>
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ 
            py: 8, 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: alpha(theme.palette.primary.light, 0.05)
          }}>
            <InventoryIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.5) }} />
            <Typography variant="h6" color="text.secondary">
              No products found
            </Typography>
            <Typography color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
              Get started by adding your first product using the + button at the bottom right
            </Typography>
          </Box>
        ) : (
          <Products products={products} onProductUpdated={updateProductList} />
        )}
      </Paper>
      
      <Grid
        item
        xs={12}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 30,
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          zIndex: 999
        }}
      >
        <AddProduct onAdded={updateProductList} />
      </Grid>
    </>
  );
}








