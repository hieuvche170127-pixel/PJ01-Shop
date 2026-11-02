import * as React from 'react';
import { Autocomplete, TextField, Grid, Button, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, MenuItem, Snackbar, Alert, Fab, Tooltip, Zoom } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import { styled } from '@mui/material/styles';
import axios from 'axios'; // For making API requests
// Import api instead of SellerService
import { api } from '../../../services/index';
import { uploadProductImage } from '../../../services/uploadImage';

// Define VisuallyHiddenInput for file upload
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function AddProduct({ onAdded }) {
  const [openAddProductDialog, setOpenAddProductDialog] = React.useState(false);
  const [openAddCategoryDialog, setOpenAddCategoryDialog] = React.useState(false);  // New state for Add Category Dialog
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [price, setPrice] = React.useState(0);
  const [isAuction, setIsAuction] = React.useState('false');
  // const [auctionEndTime, setAuctionEndTime] = React.useState('');
  const [quantity, setQuantity] = React.useState(0);
  const [image, setImage] = React.useState('');
  const [snackbar, setSnackbar] = React.useState({ open: false, msg: '', severity: 'success' });
  const [categories, setCategories] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);

  const [newCategoryName, setNewCategoryName] = React.useState('');  // For category name input
  const [newCategoryDescription, setNewCategoryDescription] = React.useState('');  // For category description input

  // Fetch categories
  React.useEffect(() => {
    // Use direct API call
    api.get('seller/categories')
      .then(res => setCategories(res.data.data || []))
      .catch(err => {
        console.error("Error fetching categories:", err);
        setCategories([]);
      });
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
        if (uploading) return;

    const requestBody = {
      title,
      description,
      price: Number(price),
      image,
      categoryId,
      isAuction: isAuction === 'true',
      quantity: Number(quantity)
    };

    // if (isAuction === 'true' && auctionEndTime) {
    //   requestBody.auctionEndTime = auctionEndTime;
    // }

    try {
      // Use direct API call
      const result = await api.post('seller/products', requestBody);

      if (result.data?.success) {
        setSnackbar({ open: true, msg: 'Product added successfully!', severity: 'success' });
        setOpenAddProductDialog(false);
        // Reset form fields
        setTitle('');
        setDescription('');
        setCategoryId('');
        setPrice(0);
        setIsAuction('false');
        // setAuctionEndTime('');
        setQuantity(0);
        setImage('');
        onAdded();
      } else {
        setSnackbar({ open: true, msg: result.data.message, severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, msg: 'Error occurred while adding the product.', severity: 'error' });
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try { setImage(await uploadProductImage(file)); }
    catch (error) { setSnackbar({ open: true, msg: error.response?.data?.message || error.message, severity: 'error' }); }
    finally { setUploading(false); e.target.value = ''; }
  };
  const handleAddCategoryClick = () => {
    setOpenAddCategoryDialog(true); // Opens the category creation dialog
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setSnackbar({ open: true, msg: "Category name is required", severity: 'error' });
      return;
    }

    try {
      // Use direct API call
      const result = await api.post('seller/categories', {
        name: newCategoryName,
        description: newCategoryDescription
      });

      if (result.data?.success) {
        setSnackbar({ open: true, msg: 'Category added successfully!', severity: 'success' });
        setOpenAddCategoryDialog(false);
        setNewCategoryName('');
        setNewCategoryDescription('');
        setCategories(prev => [...prev, result.data.data]);
      } else {
        setSnackbar({ open: true, msg: result.data.message, severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, msg: 'Error occurred while adding the category.', severity: 'error' });
    }
  };

  return (
    <>
      <Tooltip title="Add new product">
        <Zoom in={true}>
          <Fab aria-label="Add" color="primary" onClick={() => setOpenAddProductDialog(true)}>
            <AddIcon />
          </Fab>
        </Zoom>
      </Tooltip>

      <Dialog open={openAddProductDialog} onClose={() => setOpenAddProductDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: "#1976d2" }}>
          Add New Product
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            To add new products to the store, please fill out the information below and submit a request.
          </DialogContentText>

          <form onSubmit={handleAddProduct}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Product Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6} container spacing={2} alignItems="center">
                <Grid item xs={10}>
                  <Autocomplete
                    options={categories}
                    getOptionLabel={(option) => option.name}
                    value={categories.find(category => category._id === categoryId) || null}
                    onChange={(e, newValue) => setCategoryId(newValue ? newValue._id : '')}
                    renderInput={(params) => <TextField {...params} label="Category" />}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={2}>
                  <Tooltip title="Add new category">
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleAddCategoryClick}
                      fullWidth
                    >
                      +
                    </Button>
                  </Tooltip>
                </Grid>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </Grid>


              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Image URL" 
                  value={image || ''}
                  onChange={(e) => setImage(e.target.value)} // For URL input
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button disabled={uploading} component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                  Upload Image
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleImageChange}// For file upload
                  />
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Is Action"
                  value={isAuction}
                  onChange={(e) => setIsAuction(e.target.value)}
                  fullWidth
                  required
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <DialogActions>
              <Button onClick={() => setOpenAddProductDialog(false)}>Cancel</Button>
              <Button disabled={uploading} type="submit" variant="contained" color="primary">
                Add Product
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openAddCategoryDialog} onClose={() => setOpenAddCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Category Description"
            value={newCategoryDescription}
            onChange={(e) => setNewCategoryDescription(e.target.value)}
            required
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
          <DialogActions>
            <Button onClick={() => setOpenAddCategoryDialog(false)} color="secondary">Cancel</Button>
            <Button onClick={handleAddCategory} variant="contained" color="primary">Add Category</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>
    </>
  );
}
