import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Avatar, Typography, CircularProgress, Container, Paper, Button, 
  TextField, Snackbar, Alert, Grid, IconButton, InputAdornment,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Card, CardContent, Divider, Tooltip
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import LoginIcon from '@mui/icons-material/Login';

import { fetchUserProfile, updateUserProfile, resetUpdateStatus } from '../../features/profile/profileSlice';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get auth and profile state from Redux
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { user, loading, error, updateSuccess, updateLoading, updateError } = useSelector((state) => state.profile);
  
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ avatarURL: '', fullname: '', password: '', currentPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      // Short delay to allow checking token
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          navigate('/signin');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, navigate]);

  // Fetch profile data when component mounts
  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      setForm({
        avatarURL: user.avatarURL || '',
        fullname: user.fullname || '',
        password: '', currentPassword: ''
      });
    }
  }, [user]);

  // Handle successful profile update
  useEffect(() => {
    if (updateSuccess) {
      setSuccessMsg('Cập nhật thông tin thành công!');
      setEditMode(false);
      
      // Clear password field after successful update
      setForm(prev => ({
        ...prev,
        password: '', currentPassword: ''
      }));
      
      // Reset update status after showing success message
      setTimeout(() => {
        dispatch(resetUpdateStatus());
      }, 3000);
    }
  }, [updateSuccess, dispatch]);

  const handleRedirectToLogin = () => {
    navigate('/signin');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation errors when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // Reset avatar error state when changing URL
    if (name === 'avatarURL') {
      setAvatarError(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (form.fullname && form.fullname.length < 2) {
      errors.fullname = 'Họ tên phải dài ít nhất 2 ký tự';
    }
    
    if (form.password && form.password.length < 8) {
      errors.password = 'Mật khẩu phải dài ít nhất 8 ký tự';
    }
    
    if (form.password && !form.currentPassword) errors.currentPassword = 'Nhập mật khẩu hiện tại';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAvatarLoad = () => {
    setAvatarLoading(false);
    setAvatarError(false);
  };

  const handleAvatarError = () => {
    setAvatarLoading(false);
    setAvatarError(true);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = () => {
    // Validate the form first
    if (!validateForm()) {
      return;
    }
    
    // Open confirmation dialog
    setConfirmDialog(true);
  };
  
  const handleSave = async () => {
    setConfirmDialog(false);
    
    const dataToSend = { ...form };
    
    // Only send password if it's not empty
    if (!dataToSend.password) {
      delete dataToSend.password;
    }
    
    dispatch(updateUserProfile(dataToSend));
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm({
      avatarURL: user?.avatarURL || '',
      fullname: user?.fullname || '',
      password: '', currentPassword: ''
    });
    setFormErrors({});
  };

  const handleRefresh = () => {
    dispatch(fetchUserProfile());
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !user) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, p: 2 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Thử lại
          </Button>
          
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<LoginIcon />}
            onClick={handleRedirectToLogin}
          >
            Đăng nhập
          </Button>
        </Box>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" color="error">Không có dữ liệu người dùng.</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Tải lại
        </Button>
      </Box>
    );
  }

  const avatarUrl = editMode 
    ? (form.avatarURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || user.username || 'User')}`) 
    : (user.avatarURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || user.username || 'User')}`);

  return (
    <Container maxWidth="md" sx={{ p: { xs: 2, md: 3 } }}>
      <Card elevation={3} sx={{ borderRadius: 4, overflow: 'hidden', mt: { xs: 4, md: 6 } }}>
        <Box 
          sx={{ 
            bgcolor: 'primary.main', 
            height: 100, 
            width: '100%',
            position: 'relative'
          }} 
        />
        
        <CardContent sx={{ p: { xs: 2, md: 4 }, pt: 0, mt: -6, position: 'relative' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              {editMode && form.avatarURL && (
                <>
                  {avatarLoading && (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: 120, 
                      height: 120, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'rgba(255,255,255,0.7)',
                      borderRadius: '50%'
                    }}>
                      <CircularProgress size={40} />
                    </Box>
                  )}
                  <img 
                    src={form.avatarURL}
                    alt="preview" 
                    style={{ display: 'none' }}
                    onLoad={handleAvatarLoad}
                    onError={handleAvatarError}
                  />
                </>
              )}
              
              <Avatar
                src={avatarError ? null : avatarUrl}
                alt={user.fullname || user.username}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  border: '4px solid white',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  bgcolor: avatarError ? 'error.light' : 'primary.light'
                }}
              >
                {avatarError && <PersonIcon sx={{ fontSize: 60 }} />}
              </Avatar>
            </Box>

            <Box sx={{ width: '100%', mt: 4 }}>
              {editMode ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Link ảnh đại diện"
                      name="avatarURL"
                      value={form.avatarURL}
                      onChange={handleChange}
                      fullWidth
                      error={avatarError}
                      helperText={avatarError ? "URL ảnh không hợp lệ" : ""}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Họ tên"
                      name="fullname"
                      value={form.fullname}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      error={!!formErrors.fullname}
                      helperText={formErrors.fullname}
                    />
                  </Grid>
                    <Grid item xs={12}><TextField label="Mật khẩu hiện tại (khi đổi mật khẩu)" name="currentPassword" type="password" autoComplete="current-password" fullWidth value={form.currentPassword} onChange={handleChange} error={!!formErrors.currentPassword} helperText={formErrors.currentPassword} /></Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Mật khẩu mới (để trống nếu không đổi)"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      error={!!formErrors.password}
                      helperText={formErrors.password}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {user.fullname || user.username || 'No name'}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{user.username}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{user.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">Vai trò</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium', textTransform: 'capitalize' }}>
                      {user.role === 'buyer' ? 'Người mua' : user.role === 'seller' ? 'Người bán' : user.role}
                    </Typography>
                  </Grid>
                </Grid>

                {user.action && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: user.action === 'lock' ? 'error.main' : 'success.main' }}>
                      Trạng thái: {user.action === 'lock' ? 'Tài khoản bị khóa' : 'Đang hoạt động'}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  {editMode ? (
                    <>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSubmit} 
                        disabled={updateLoading}
                        startIcon={<SaveIcon />}
                        sx={{ minWidth: 120 }}
                      >
                        {updateLoading ? 'Đang lưu...' : 'Lưu'}
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={handleCancel}
                        disabled={updateLoading}
                        startIcon={<CancelIcon />}
                        sx={{ minWidth: 120 }}
                      >
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="contained" 
                        onClick={() => setEditMode(true)}
                        startIcon={<EditIcon />}
                        sx={{ minWidth: 150 }}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={handleRefresh}
                        startIcon={<RefreshIcon />}
                      >
                        Làm mới
                      </Button>
                    </>
                  )}
                </Box>

                <Tooltip title="ID tài khoản" arrow placement="top">
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 4 }}>
                    ID: {user._id}
                  </Typography>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
      >
        <DialogTitle>Xác nhận thay đổi</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn lưu những thay đổi này không?
            {form.password && (
              <Typography color="primary" sx={{ mt: 1 }}>
                *Mật khẩu của bạn sẽ được thay đổi sau khi xác nhận.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} color="primary">
            Hủy
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained" autoFocus>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>

      {/* Error Message */}
      <Snackbar
        open={!!updateError}
        autoHideDuration={3000}
        onClose={() => dispatch(resetUpdateStatus())}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => dispatch(resetUpdateStatus())} severity="error" sx={{ width: '100%' }}>
          {updateError}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile; 