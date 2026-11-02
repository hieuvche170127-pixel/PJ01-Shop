import { API_URL } from '../../utils/apiUrl';
// paymentSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';



export const createPayment = createAsyncThunk(
  'payment/createPayment',
  async (paymentData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }

      // Validate orderId is present
      if (!paymentData.orderId) {
        console.error('Missing orderId in payment data:', paymentData);
        return rejectWithValue('Missing order ID. Please try again.');
      }

      // Ensure orderId is a string
      const sanitizedData = {
        ...paymentData,
        orderId: String(paymentData.orderId),
        replaceExisting: paymentData.replaceExisting || false // Add flag to indicate if previous payment should be deleted
      };
      
      console.log('Creating payment with data:', sanitizedData);
      
      const response = await axios.post(`${API_URL}/buyers/payments`, sanitizedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Add extra validation to ensure we have required fields based on payment method
      const data = response.data;
      
      if (paymentData.method === 'VietQR' && (!data.qrData || !data.qrData.qrDataURL)) {
        console.error('VietQR API response missing qrData or qrDataURL:', data);
        return rejectWithValue('QR code generation failed. Please try another payment method.');
      }
      
      if (paymentData.method === 'PayOS' && !data.paymentUrl) {
        console.error('PayOS API response missing paymentUrl:', data);
        return rejectWithValue('Payment URL generation failed. Please try another payment method.');
      }
      
      return data;
    } catch (error) {
      console.error('Payment creation error:', error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.response?.data?.details || 
        'Failed to create payment. Please try again.'
      );
    }
  }
);

// Thêm hàm kiểm tra trạng thái thanh toán
export const checkPaymentStatus = createAsyncThunk(
  'payment/checkPaymentStatus',
  async (orderId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(`${API_URL}/buyers/payments/status/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Payment status check error:', error);
      return rejectWithValue(
        error.response?.data?.message || 
        'Failed to check payment status.'
      );
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    payment: null,
    paymentStatus: null,
    loading: false,
    statusChecking: false,
    error: null,
    success: false,
  },
  reducers: {
    resetPayment: (state) => {
      state.payment = null;
      state.paymentStatus = null;
      state.success = false;
      state.error = null;
    },
    cancelPaymentPolling: (state) => {
      // This action is specifically for canceling the polling process
      // It can be called when navigating away from payment pages
      state.statusChecking = false;
      // Also reset any related data to prevent callback issues
      state.paymentStatus = null;
      state.loading = false;
      // Don't reset other data in case we want to keep payment information
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payment = action.payload;
        state.success = true;
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Thêm reducers cho checkPaymentStatus
      .addCase(checkPaymentStatus.pending, (state) => {
        state.statusChecking = true;
      })
      .addCase(checkPaymentStatus.fulfilled, (state, action) => {
        state.statusChecking = false;
        state.paymentStatus = action.payload;
      })
      .addCase(checkPaymentStatus.rejected, (state) => {
        state.statusChecking = false;
      });
  },
});

export const { resetPayment, cancelPaymentPolling } = paymentSlice.actions;
export default paymentSlice.reducer;