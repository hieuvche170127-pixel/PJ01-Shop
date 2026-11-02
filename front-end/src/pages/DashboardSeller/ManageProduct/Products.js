import { formatVND } from '../../../utils/currency';
import { resolveProductImage } from '../../../utils/productImage';
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, FormGroup, IconButton, Paper, Snackbar, TableContainer } from '@mui/material';
import { Grid } from '@mui/material';
import { TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import UpdateProduct from './UpdateProduct'; // Đường dẫn đúng file của bạn
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import Chip from '@mui/material/Chip';
import { api } from '../../../services/index';

export default function Products({ products, onProductUpdated }) {
  const navigate = useNavigate();
  const [keywords, setKeywords] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState([]);
  const [actionFilter, setActionFilter] = React.useState('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [editingProduct, setEditingProduct] = React.useState(null);

  const [deletingProduct, setDeletingProduct] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, msg: '', severity: 'success' });

  // Helper function for navigation to product detail
  const navigateToProduct = (productId) => {
    console.log("Navigating to product:", productId);
    // Make sure path is correct relative to current route
    navigate(`../product/${productId}`);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      // Use direct API call
      await api.delete(`seller/products/${deletingProduct.productId._id}`);
      setSnackbar({ open: true, msg: 'Xóa sản phẩm thành công!', severity: 'success' });
      setDeletingProduct(null);
      onProductUpdated(); // Reload lại list từ parent
    } catch (error) {
      setSnackbar({ open: true, msg: 'Lỗi khi xóa sản phẩm!', severity: 'error' });
      setDeletingProduct(null);
    }
  };

  const categories = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const allCategories = products
      .map(p => p.productId?.categoryId)
      .filter(Boolean); // Filter out null/undefined categoryId
    const map = new Map();
    allCategories.forEach(cat => {
      if (cat && cat._id && !map.has(cat._id)) {
        map.set(cat._id, cat);
      }
    });
    return Array.from(map.values());
  }, [products]);

  const sortedData = React.useMemo(() => {
    let filtered = products;

    // 1. Lọc theo từ khoá
    if (keywords.trim() !== "") {
      const keywordLower = keywords.trim().toLowerCase();
      filtered = filtered.filter(
        p =>
          p.productId?.title && p.productId.title.toLowerCase().includes(keywordLower)
      );
    }

    // 2. Lọc theo category (dựa trên kết quả bước 1)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        p => p.productId?.categoryId && selectedCategories.includes(p.productId.categoryId._id)
      );
    }

    // 3. Lọc theo trạng thái action (dựa trên kết quả bước 2)
    if (actionFilter === "available") {
      filtered = filtered.filter(p => p.productId?.isAuction === true);
    }
    if (actionFilter === "notAvailable") {
      filtered = filtered.filter(p => p.productId?.isAuction === false);
    }
    return [...filtered];
  }, [products, selectedCategories, actionFilter, keywords]);

  const PRODUCTS_PER_PAGE = 5;
  const totalPages = Math.ceil(sortedData.length / PRODUCTS_PER_PAGE);
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIdx = startIdx + PRODUCTS_PER_PAGE;
  const pageData = sortedData.slice(startIdx, endIdx);


  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, actionFilter, keywords]);


  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (

    <React.Fragment>
      <Dialog
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
      >
        <DialogTitle>Xác nhận xoá sản phẩm</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá sản phẩm <b>{deletingProduct?.productId?.title}</b> này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingProduct(null)} color="secondary">Huỷ</Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained">Xoá</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>

      <Grid>
        <Grid container spacing={2} mb={3} justifyContent="center" alignItems="center">
          <Grid item xs={8} md={6}>
            <TextField
              // required
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              size="small"
              fullWidth
              // id="outlined-basic"
              label="Search by name product"
              // variant="outlined"
              InputProps={{ endAdornment: <SearchIcon /> }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                borderRadius: 3,
                bgcolor: 'background.paper',
                p: 2,
                mb: 3,
                minWidth: 200,
                maxWidth: 260

              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" color="text.secondary" letterSpacing={2}>
                  <FilterAltIcon fontSize="small" sx={{ mr: 0.5, color: "primary.main" }} />
                  FILTERS
                </Typography>
                {(selectedCategories.length > 0 || actionFilter !== 'all') && (
                  <Tooltip title="Clear all">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedCategories([]);
                        setActionFilter('all');
                      }}
                    >
                      <ClearAllIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {/* Category */}
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  CATEGORY
                </Typography>
                <Box
                  sx={{
                    maxHeight: 160,
                    overflowY: categories.length > 4 ? "auto" : "unset",
                    mt: 1,
                    pr: 1
                  }}
                >
                  <FormGroup>
                    {categories.map((cat) => (
                      <FormControlLabel
                        key={cat._id}
                        control={
                          <Checkbox
                            checked={selectedCategories.includes(cat._id)}
                            onChange={() => handleCategoryChange(cat._id)}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2">{cat?.name || 'Uncategorized'}</Typography>}
                        sx={{ mb: 0.5 }}
                      />
                    ))}
                  </FormGroup>
                </Box>
              </Box>

              {/* Action/Status */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  STATUS
                </Typography>
                <RadioGroup
                  value={actionFilter}
                  onChange={e => setActionFilter(e.target.value)}
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel value="all" control={<Radio size="small" />} label={<Typography variant="body2">All</Typography>} />
                  <FormControlLabel value="available" control={<Radio size="small" />} label={<Typography variant="body2">Available</Typography>} />
                  <FormControlLabel value="notAvailable" control={<Radio size="small" />} label={<Typography variant="body2">Not Available</Typography>} />
                </RadioGroup>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={9}>
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #ddd', boxShadow: 'none' }}>
              <Table sx={{ borderCollapse: 'separate' }}>

                <TableHead>
                  <TableRow>
                    <TableCell><b>Product</b></TableCell>
                    <TableCell><b>Price</b></TableCell>
                    <TableCell><b>Quantity</b></TableCell>
                    <TableCell><b>Action</b></TableCell>
                    <TableCell><b>Category</b></TableCell>
                    <TableCell><b>Tool</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageData.map((product, index) => (
                    <TableRow style={{ cursor: 'pointer' }} key={product.productId._id}>
                      <TableCell onClick={() => navigateToProduct(product.productId._id)}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <img
                            src={resolveProductImage(product.productId?.image)}
                            alt="product"
                            width={80}
                            height={80}
                            style={{ borderRadius: 8, objectFit: 'cover', border: '1px solid #eee' }}
                          />
                          <div style={{ flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight={600}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToProduct(product.productId._id);
                              }}
                              sx={{ cursor: 'pointer' }}
                            >
                              {product.productId?.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                              <strong>ID: {product.productId?._id}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                              {product.productId?.description}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => navigateToProduct(product.productId._id)}>{formatVND(product.productId?.price)}</TableCell>
                      <TableCell onClick={() => navigateToProduct(product.productId._id)}>{product.quantity}</TableCell>
                      <TableCell onClick={() => navigateToProduct(product.productId._id)}>
                        {product.productId?.isAuction ? (
                          <Chip label="Available" color="success" size="small" />
                        ) : (
                          <Chip label="Not Available" color="error" size="small" />
                        )}
                      </TableCell>

                      <TableCell onClick={() => navigateToProduct(product.productId._id)}>{product.productId?.categoryId?.name}</TableCell>
                      <TableCell>
                        <Tooltip title="Update">
                          <EditIcon
                            color="primary"
                            style={{ cursor: 'pointer', marginRight: 8 }}
                            onClick={() => setEditingProduct(product)}
                          />
                        </Tooltip>
                        <Tooltip title="Delete">
                          <DeleteIcon
                            color="error"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setDeletingProduct(product)}
                          />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>

              </Table>
            </TableContainer>
            <Stack spacing={2} sx={{ mt: 3 }}>
              <Pagination
                page={currentPage}
                count={totalPages}
                onChange={(e, value) => setCurrentPage(value)}
                showFirstButton
                showLastButton
                sx={{ display: 'flex', justifyContent: 'center' }}
              />
            </Stack>

            {editingProduct && (
              <UpdateProduct
                targetProduct={editingProduct}
                onUpdated={() => {
                  onProductUpdated();
                  setEditingProduct(null);
                }}
                open={Boolean(editingProduct)}
                handleClose={() => setEditingProduct(null)}
              />
            )}
          </Grid>

        </Grid>
      </Grid>

    </React.Fragment>

  );
}
