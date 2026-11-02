import { resolveProductImage } from '../../utils/productImage';
import { formatVND } from '../../utils/currency';
import React from "react";
import { 
  Box, 
  Typography, 
  IconButton, 
  Checkbox,
  Paper
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { motion } from "framer-motion";

const ItemCard = ({ 
  item, 
  isSelected, 
  onSelect, 
  onUpdateQuantity, 
  onRemoveItem 
}) => {
  if (!item) return null;

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item._id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    // Check if item has inventory data and if current quantity is below inventory
    const inventoryQuantity = item.inventoryQuantity || 0;
    if (item.quantity < inventoryQuantity) {
      onUpdateQuantity(item._id, item.quantity + 1);
    }
  };

  // Determine if the increase button should be disabled
  const isIncreaseDisabled = item.quantity >= (item.inventoryQuantity || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 2,
          border: '1px solid #eee',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {/* Checkbox */}
          <Box sx={{ mr: 1 }}>
            <Checkbox
              checked={isSelected}
              onChange={onSelect}
              sx={{ color: '#0F52BA', '&.Mui-checked': { color: '#0F52BA' } }}
            />
          </Box>
          
          {/* Product Image */}
          <Box 
            sx={{ 
              width: 80, 
              height: 80, 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: 1,
              mr: 2,
              overflow: 'hidden'
            }}
          >
            <img 
              src={resolveProductImage(item.image)} 
              alt={item.name || "Product"} 
              style={{ 
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>
          
          {/* Product Details */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {item.title || item.name || "Product Name"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatVND(item.price)} per item
            </Typography>
            {item.inventoryQuantity !== undefined && (
              <Typography variant="body2" color="text.secondary">
                Available: {item.inventoryQuantity} in stock
              </Typography>
            )}
          </Box>
          
          {/* Quantity Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <IconButton 
              size="small" 
              onClick={handleDecrease}
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
              onClick={handleIncrease}
              disabled={isIncreaseDisabled}
              sx={{ 
                border: '1px solid #e0e0e0',
                borderRadius: '0 4px 4px 0',
                p: 0.5
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Subtotal */}
          <Box sx={{ minWidth: 80, textAlign: 'right', mr: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#0F52BA">
              {formatVND((item.quantity * (item.price || 0)))}
            </Typography>
          </Box>
          
          {/* Remove Button */}
          <IconButton 
            onClick={() => onRemoveItem(item._id)} 
            size="small"
            sx={{ color: '#d32f2f' }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default ItemCard;