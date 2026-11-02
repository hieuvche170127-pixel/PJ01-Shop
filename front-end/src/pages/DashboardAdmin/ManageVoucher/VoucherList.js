import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Button,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  Divider,
  Alert,
  Snackbar,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import SearchIcon from '@mui/icons-material/Search';
import VoucherForm from './VoucherForm';
import VoucherService from './VoucherService';
import Title from '../Title';

const VoucherList = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, voucher: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedActionVoucher, setSelectedActionVoucher] = useState(null);

  // Fetch voucher data
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      // Refresh token before making API call
      VoucherService.refreshToken();
      const data = await VoucherService.getAllVouchers();
      setVouchers(data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || 'Unknown error';
      
      let displayMessage = 'Error loading voucher data';
      
      if (status === 403) {
        displayMessage = 'You do not have permission to access vouchers. Please make sure you are logged in as an admin.';
      } else if (status === 401) {
        displayMessage = 'Authentication error. Please log in again.';
      } else if (errorMessage) {
        displayMessage = `Error: ${errorMessage}`;
      }
      
      setSnackbar({
        open: true,
        message: displayMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Handle open actions menu
  const handleOpenActionMenu = (event, voucher) => {
    setAnchorEl(event.currentTarget);
    setSelectedActionVoucher(voucher);
  };

  const handleCloseActionMenu = () => {
    setAnchorEl(null);
  };

  // Filter vouchers based on search term
  const filteredVouchers = vouchers.filter(voucher => 
    voucher.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle add/edit form
  const handleOpenForm = (voucher = null) => {
    if (voucher) {
      setSelectedVoucher(voucher);
      setIsEdit(true);
    } else {
      setSelectedVoucher(null);
      setIsEdit(false);
    }
    setOpenForm(true);
    handleCloseActionMenu();
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedVoucher(null);
  };

  // Handle form submission
  const handleSubmitForm = async (formData) => {
    try {
      setLoading(true);
      
      if (isEdit) {
        await VoucherService.updateVoucher(selectedVoucher._id, formData);
        setSnackbar({
          open: true,
          message: 'Voucher updated successfully',
          severity: 'success'
        });
      } else {
        await VoucherService.createVoucher(formData);
        setSnackbar({
          open: true,
          message: 'New voucher created successfully',
          severity: 'success'
        });
      }
      
      fetchVouchers();
      handleCloseForm();
    } catch (error) {
      console.error('Error saving voucher:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.response?.data?.message || 'Could not save voucher'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete voucher
  const handleDeleteClick = (voucher) => {
    setDeleteDialog({ open: true, voucher });
    handleCloseActionMenu();
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await VoucherService.deleteVoucher(deleteDialog.voucher._id);
      
      setSnackbar({
        open: true,
        message: 'Voucher deleted successfully',
        severity: 'success'
      });
      
      fetchVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting voucher',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteDialog({ open: false, voucher: null });
    }
  };

  // Handle toggle voucher status
  const handleToggleStatus = async (voucher) => {
    try {
      setLoading(true);
      await VoucherService.toggleVoucherStatus(voucher._id);
      
      setSnackbar({
        open: true,
        message: `Voucher ${voucher.isActive ? 'deactivated' : 'activated'} successfully`,
        severity: 'success'
      });
      
      fetchVouchers();
    } catch (error) {
      console.error('Error toggling voucher status:', error);
      setSnackbar({
        open: true,
        message: 'Error changing voucher status',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      handleCloseActionMenu();
    }
  };

  // Copy voucher code to clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setSnackbar({
      open: true,
      message: 'Voucher code copied to clipboard',
      severity: 'info'
    });
    handleCloseActionMenu();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const isExpired = (dateString) => {
    try {
      const expirationDate = new Date(dateString);
      return expirationDate < new Date();
    } catch {
      return true;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(amount);
  };

  return (
    <Box>
      <Box mb={4}>
        <Title highlight={true}>Voucher Management</Title>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Create and manage discount vouchers for users across the system.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ borderRadius: 2, mb: 4 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <TextField
              placeholder="Search by voucher code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
            >
              Add Voucher
            </Button>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {vouchers.length === 0 && !loading ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No vouchers have been created yet. Add a new voucher using the "Add Voucher" button.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table sx={{ minWidth: 650 }} size="small">
                <TableHead sx={{ bgcolor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Voucher Code</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Discount</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Min Order Value</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Max Discount</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Expiration</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Usage</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredVouchers.map((voucher) => (
                    <TableRow 
                      key={voucher._id}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        backgroundColor: isExpired(voucher.expirationDate) ? 'rgba(0,0,0,0.04)' : 'inherit'
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        <Tooltip title="Copy">
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              cursor: 'pointer'
                            }}
                            onClick={() => handleCopyCode(voucher.code)}
                          >
                            {voucher.code}
                            <ContentCopyIcon 
                              fontSize="small" 
                              color="action" 
                              sx={{ ml: 0.5, opacity: 0.5, fontSize: '0.9rem' }} 
                            />
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{voucher.discountType === 'fixed' ? formatCurrency(voucher.discount) : `${voucher.discount}%`}</TableCell>
                      <TableCell>{formatCurrency(voucher.minOrderValue)}</TableCell>
                      <TableCell>
                        {voucher.maxDiscount ? formatCurrency(voucher.maxDiscount) : 'No limit'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={formatDate(voucher.expirationDate)}
                          color={isExpired(voucher.expirationDate) ? 'error' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {voucher.usedCount || 0}/{voucher.usageLimit}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={voucher.isActive ? 'Active' : 'Inactive'}
                          color={voucher.isActive ? 'success' : 'default'}
                          size="small"
                          variant={voucher.isActive ? 'default' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(event) => handleOpenActionMenu(event, voucher)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseActionMenu}
        PaperProps={{
          sx: { minWidth: 180, boxShadow: '0px 2px 10px rgba(0,0,0,0.1)', borderRadius: 2 }
        }}
      >
        <MenuItem onClick={() => handleOpenForm(selectedActionVoucher)}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCopyCode(selectedActionVoucher?.code)}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Copy Code</ListItemText>
        </MenuItem>
        <Divider />
        {selectedActionVoucher && (
          <MenuItem onClick={() => handleToggleStatus(selectedActionVoucher)}>
            <ListItemIcon>
              {selectedActionVoucher.isActive ? (
                <ToggleOffIcon fontSize="small" color="warning" />
              ) : (
                <ToggleOnIcon fontSize="small" color="success" />
              )}
            </ListItemIcon>
            <ListItemText>
              {selectedActionVoucher.isActive ? 'Deactivate' : 'Activate'}
            </ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleDeleteClick(selectedActionVoucher)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <DeleteIcon color="error" sx={{ mr: 1 }} />
            Delete Voucher Confirmation
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete voucher <b>{deleteDialog.voucher?.code}</b>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, voucher: null })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Voucher Form Dialog */}
      {openForm && (
        <VoucherForm
          open={openForm}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          voucher={selectedVoucher}
          isEdit={isEdit}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VoucherList; 