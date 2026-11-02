import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, MenuItem, Switch, FormControlLabel, Alert } from '@mui/material';

const initial = { code: '', discountType: 'percentage', discount: '', minOrderValue: 0, usageLimit: 1, maxDiscount: 0, expirationDate: '', isActive: true };
const VoucherForm = ({ open, onClose, onSubmit, voucher = null, isEdit = false }) => {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  useEffect(() => {
    const date = voucher?.expirationDate ? new Date(voucher.expirationDate).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }) : '';
    setForm(isEdit && voucher ? { ...initial, ...voucher, expirationDate: date } : { ...initial });
    setError('');
  }, [voucher, isEdit, open]);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = e => {
    e.preventDefault();
    const payload = { code: form.code.trim().toUpperCase(), discountType: form.discountType, expirationDate: form.expirationDate, isActive: form.isActive };
    for (const key of ['discount', 'minOrderValue', 'usageLimit', 'maxDiscount']) {
      if (form[key] === '' || !Number.isSafeInteger(Number(form[key]))) return setError('Các giá trị số phải là số nguyên.');
      payload[key] = Number(form[key]);
    }
    if (!/^[A-Z0-9_-]{3,50}$/.test(payload.code)) return setError('Mã cần 3–50 ký tự chữ, số hoặc dấu gạch.');
    if (payload.discount <= 0 || (payload.discountType === 'percentage' && payload.discount > 100)) return setError('Giảm giá phải dương; phần trăm tối đa 100.');
    if (payload.minOrderValue < 0 || payload.maxDiscount < 0 || payload.usageLimit < Math.max(1, voucher?.usedCount || 0)) return setError('Giá trị không được âm; giới hạn lượt không thấp hơn số đã dùng.');
    if (!payload.expirationDate) return setError('Chọn ngày hết hạn.');
    setError(''); onSubmit(payload);
  };
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <Box component="form" onSubmit={submit}>
      <DialogTitle>{isEdit ? 'Sửa voucher' : 'Thêm voucher'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'grid', gap: 2 }}>
          <TextField label="Mã voucher" name="code" value={form.code} onChange={change} required />
          <TextField select label="Loại giảm giá" name="discountType" value={form.discountType} onChange={change}>
            <MenuItem value="percentage">Theo phần trăm (%)</MenuItem><MenuItem value="fixed">Số tiền cố định (VND)</MenuItem>
          </TextField>
          <TextField label={form.discountType === 'fixed' ? 'Số tiền giảm (VND)' : 'Phần trăm giảm (%)'} name="discount" type="number" value={form.discount} onChange={change} inputProps={{ min: 1, step: 1, ...(form.discountType === 'percentage' ? { max: 100 } : {}) }} required />
          <TextField label="Đơn tối thiểu (VND)" name="minOrderValue" type="number" value={form.minOrderValue} onChange={change} inputProps={{ min: 0, step: 1 }} />
          <TextField label="Giảm tối đa (VND; 0 = không giới hạn)" name="maxDiscount" type="number" value={form.maxDiscount} onChange={change} disabled={form.discountType === 'fixed'} inputProps={{ min: 0, step: 1 }} />
          <TextField label="Giới hạn lượt dùng" name="usageLimit" type="number" value={form.usageLimit} onChange={change} inputProps={{ min: Math.max(1, voucher?.usedCount || 0), step: 1 }} />
          <TextField label="Ngày hết hạn (hết ngày, giờ Việt Nam)" name="expirationDate" type="date" value={form.expirationDate} onChange={change} InputLabelProps={{ shrink: true }} required />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Bật voucher (vẫn cần còn hạn và còn lượt)" />
        </Box>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Đóng</Button><Button type="submit" variant="contained">Lưu</Button></DialogActions>
    </Box>
  </Dialog>;
};
export default VoucherForm;
