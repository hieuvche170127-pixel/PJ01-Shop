import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Alert, Box, Button, Container, Divider, Paper, Typography } from '@mui/material';
import { createPayment } from '../../features/payment/paymentSlice';
import { formatVND } from '../../utils/currency';

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const orderId = state?.orderId;
  const confirmCOD = async () => {
    if (busy || !orderId) return;
    setBusy(true); setError('');
    try {
      await dispatch(createPayment({ orderId: String(orderId), method: 'COD' })).unwrap();
      navigate('/order-history', { replace: true });
    } catch (e) { setError(typeof e === 'string' ? e : 'Không thể xác nhận COD. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  };
  return <Container maxWidth="sm" sx={{ py: 6 }}>
    <Paper sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>Xác nhận đơn COD</Typography>
      {!orderId ? <><Alert severity="info">Chọn đơn hàng trong lịch sử để xem thông tin thanh toán.</Alert><Button component={Link} to="/order-history" sx={{ mt: 2 }}>Xem đơn hàng</Button></> : <>
        <Typography>Mã đơn: {orderId}</Typography>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6">Thanh toán khi nhận hàng (COD)</Typography>
        <Typography variant="h5" sx={{ my: 2 }}>{formatVND(state?.totalPrice || 0)}</Typography>
        <Alert severity="info">Đây là đơn hàng mô phỏng. Xác nhận COD không đánh dấu đã thu tiền; seller xác nhận thu tiền sau khi giao hàng.</Alert>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
          <Button variant="contained" onClick={confirmCOD} disabled={busy}>{busy ? 'Đang xác nhận...' : 'Xác nhận COD'}</Button>
          <Button component={Link} to="/order-history">Xem đơn hàng</Button>
        </Box>
      </>}
    </Paper>
  </Container>;
}
