import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../features/address/addressSlice';
import { motion } from 'framer-motion';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button, 
  TextField, 
  Divider, 
  Chip,
  IconButton,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Address = () => {
  const dispatch = useDispatch();
  const { addresses, loading, error } = useSelector((state) => state.address);
  const [showForm, setShowForm] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleAddAddress = (address) => {
    dispatch(addAddress(address));
    setShowForm(false);
  };

  const handleUpdateAddress = (address) => {
    dispatch(updateAddress({ id: address._id, addressData: address }));
    setCurrentAddress(null);
  };

  const confirmDeleteAddress = (id) => {
    setAddressToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAddress = () => {
    dispatch(deleteAddress(addressToDelete));
    setDeleteConfirmOpen(false);
    setAddressToDelete(null);
  };

  const handleSetDefault = (id) => {
    dispatch(setDefaultAddress(id));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              color: '#0F52BA',
              position: 'relative',
              pb: 2,
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
            <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            My Addresses
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{ 
              backgroundColor: '#0F52BA',
              '&:hover': {
                backgroundColor: '#0A3C8A',
              }
            }}
          >
            Add New Address
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: '#0F52BA' }} />
          </Box>
        ) : addresses.length === 0 ? (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              You don't have any saved addresses yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Add your first address to make checkout easier
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
              sx={{ 
                backgroundColor: '#0F52BA',
                '&:hover': {
                  backgroundColor: '#0A3C8A',
                }
              }}
            >
              Add New Address
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {addresses.map((address) => (
              <Grid item xs={12} md={6} key={address._id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                      position: 'relative',
                      borderLeft: address.isDefault ? '4px solid #0F52BA' : 'none'
                    }}
                  >
                    {address.isDefault && (
                      <Chip 
                        label="Default" 
                        color="primary" 
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          top: 16, 
                          right: 16,
                          backgroundColor: '#0F52BA'
                        }} 
                      />
                    )}
                    
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {address.fullName}
                    </Typography>
                    
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {address.phone}
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      {address.street}, {address.city}, {address.state}, {address.country}
                    </Typography>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        size="small"
                        onClick={() => setCurrentAddress(address)}
                        sx={{ 
                          borderColor: '#0F52BA',
                          color: '#0F52BA',
                          '&:hover': {
                            borderColor: '#0A3C8A',
                            backgroundColor: 'rgba(15, 82, 186, 0.04)',
                          }
                        }}
                      >
                        Edit
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        size="small"
                        onClick={() => confirmDeleteAddress(address._id)}
                        sx={{ 
                          borderColor: '#d32f2f',
                          color: '#d32f2f',
                          '&:hover': {
                            borderColor: '#b71c1c',
                            backgroundColor: 'rgba(211, 47, 47, 0.04)',
                          }
                        }}
                      >
                        Delete
                      </Button>
                      
                      {!address.isDefault && (
                        <Button
                          variant="outlined"
                          startIcon={<HomeIcon />}
                          size="small"
                          onClick={() => handleSetDefault(address._id)}
                          sx={{ 
                            borderColor: '#4caf50',
                            color: '#4caf50',
                            '&:hover': {
                              borderColor: '#388e3c',
                              backgroundColor: 'rgba(76, 175, 80, 0.04)',
                            }
                          }}
                        >
                          Set as Default
                        </Button>
                      )}
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Address Form Dialog */}
        <Dialog 
          open={showForm || currentAddress !== null} 
          onClose={() => {
            setShowForm(false);
            setCurrentAddress(null);
            setPhoneError('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" fontWeight={600}>
                {currentAddress ? 'Edit Address' : 'Add New Address'}
              </Typography>
              <IconButton
                onClick={() => {
                  setShowForm(false);
                  setCurrentAddress(null);
                  setPhoneError('');
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            <AddressForm 
              address={currentAddress} 
              onSubmit={currentAddress ? handleUpdateAddress : handleAddAddress}
              phoneError={phoneError}
              setPhoneError={setPhoneError}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>
            Confirm Deletion
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Are you sure you want to delete this address? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteConfirmOpen(false)}
              sx={{ color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteAddress}
              variant="contained"
              color="error"
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

const AddressForm = ({ address, onSubmit, phoneError, setPhoneError }) => {
  const [formData, setFormData] = useState(address || {
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: '',
    isDefault: false,
  });

  useEffect(() => {
    if (address) {
      setFormData(address);
    }
  }, [address]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const validatePhoneNumber = (phone) => {
    const regex = /^0\d{9}$/;
    return regex.test(phone);
  };

  const handleSubmit = () => {
    if (!validatePhoneNumber(formData.phone)) {
      setPhoneError('Invalid phone number. Must start with 0 and contain exactly 10 digits.');
      return;
    }
    setPhoneError('');
    onSubmit(formData);
  };

  return (
    <Grid container spacing={2}>
      {phoneError && (
        <Grid item xs={12}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {phoneError}
          </Alert>
        </Grid>
      )}
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          error={!!phoneError}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Street Address"
          name="street"
          value={formData.street}
          onChange={handleChange}
          required
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="State/Province"
          name="state"
          value={formData.state}
          onChange={handleChange}
          required
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Country"
          name="country"
          value={formData.country}
          onChange={handleChange}
          required
        />
      </Grid>
      
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleCheckboxChange}
              sx={{ color: '#0F52BA', '&.Mui-checked': { color: '#0F52BA' } }}
            />
          }
          label="Set as default address"
        />
      </Grid>
      
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ 
              backgroundColor: '#0F52BA',
              '&:hover': {
                backgroundColor: '#0A3C8A',
              }
            }}
          >
            {address ? 'Update Address' : 'Save Address'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Address;