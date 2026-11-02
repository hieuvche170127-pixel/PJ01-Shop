import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { api } from '../../../services/index';
import { uploadProductImage } from '../../../services/uploadImage';

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

export default function UpdateProduct({ targetProduct, onUpdated, open, handleClose }) {
    const [categories, setCategories] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);

    // Product state
    const [title, setTitle] = React.useState(targetProduct?.productId?.title || '');
    const [description, setDescription] = React.useState(targetProduct?.productId?.description || '');
    const [categoryId, setCategoryId] = React.useState(targetProduct?.productId?.categoryId?._id || '');
    const [price, setPrice] = React.useState(targetProduct?.productId?.price || 0);
    const [image, setImage] = React.useState(targetProduct?.productId?.image || '');
    const [isAuction, setIsAuction] = React.useState(targetProduct?.productId?.isAuction ? 'true' : 'false');
    const [auctionEndTime, setAuctionEndTime] = React.useState(targetProduct?.productId?.auctionEndTime || '');
    const [quantity, setQuantity] = React.useState(targetProduct?.quantity || 0);

    // Notification
    const [snackbar, setSnackbar] = React.useState({ open: false, msg: '', severity: 'success' });

    React.useEffect(() => {
        // Use direct API call
        api.get('seller/categories')
          .then(res => setCategories(res.data.data))
          .catch(() => setCategories([]));
      }, []);

    React.useEffect(() => {
        setTitle(targetProduct?.productId?.title || '');
        setDescription(targetProduct?.productId?.description || '');
        setCategoryId(targetProduct?.productId?.categoryId?._id || '');
        setPrice(targetProduct?.productId?.price || 0);
        setImage(targetProduct?.productId?.image || '');
        setIsAuction(targetProduct?.productId?.isAuction ? 'true' : 'false');
        setAuctionEndTime(targetProduct?.productId?.auctionEndTime || '');
        setQuantity(targetProduct?.quantity || 0);
    }, [targetProduct, open]);

    const handleImageChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try { setImage(await uploadProductImage(file)); }
    catch (error) { setSnackbar({ open: true, msg: error.response?.data?.message || error.message, severity: 'error' }); }
    finally { setUploading(false); e.target.value = ''; }
  };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (uploading) return;
        try {
            const reqBody = {
                title,
                description,
                price: Number(price),
                image,
                categoryId,
                isAuction: isAuction === 'true',
                auctionEndTime: isAuction === 'true' ? (auctionEndTime || null) : null
            };
            
            // Use direct API call
            await api.put(`seller/products/${targetProduct.productId._id}`, reqBody);

            setSnackbar({ open: true, msg: "Cập nhật thành công!", severity: 'success' });
            if (onUpdated) onUpdated();
            handleClose();
        } catch (error) {
            setSnackbar({ open: true, msg: error?.response?.data?.message || "Có lỗi xảy ra!", severity: 'error' });
        }
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: "#1976d2" }}>
                    Product Updates
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                         To update products to the store, please fill out the information below and submit a request:
                    </DialogContentText>
                    <Box component="form" onSubmit={handleUpdateProduct} sx={{ mt: 0 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Product Name" variant="outlined" 
                                    fullWidth required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Category" select variant="outlined" 
                                    fullWidth required
                                    value={categoryId}
                                    onChange={e => setCategoryId(e.target.value)}>
                                    {categories.map(cate => (
                                        <MenuItem key={cate._id} value={cate._id}>{cate.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Price" type="number" variant="outlined"
                                    fullWidth required
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <TextField label="Quantity" type="number" variant="outlined" disabled helperText="Thay đổi tồn kho tại Manage Inventory"
                                    fullWidth required
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Description" variant="outlined" 
                                    fullWidth multiline minRows={2} maxRows={4}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                <TextField label="Image URL" variant="outlined" 
                                    fullWidth
                                    value={image}
                                    onChange={e => setImage(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Button disabled={uploading} component="label" startIcon={<CloudUploadIcon />} variant="outlined" fullWidth>
                                    Upload
                                    <VisuallyHiddenInput type="file" accept="image/png, image/jpeg" onChange={handleImageChange} />
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Status"
                                    select
                                    variant="outlined"
                                    fullWidth
                                    value={isAuction}
                                    onChange={e => setIsAuction(e.target.value)}
                                >
                                    <MenuItem value="true">Available</MenuItem>
                                    <MenuItem value="false">Not Available</MenuItem>
                                </TextField>
                            </Grid>                         
                        </Grid>
                        <DialogActions sx={{ mt: 2, px: 0 }}>
                            <Button onClick={handleClose} variant="text" color="secondary">
                                Cancel
                            </Button>
                            <Button disabled={uploading} type="submit" variant="contained" color="primary">
                                Save
                            </Button>
                        </DialogActions>
                    </Box>
                </DialogContent>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={2500}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
            </Snackbar>
        </>
    );
}
