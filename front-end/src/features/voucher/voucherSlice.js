import { API_URL } from '../../utils/apiUrl';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

// Define the base API URL, consistent with cartSlice.js


// Asynchronous thunk to apply a voucher by its code
export const applyVoucher = createAsyncThunk(
  'voucher/applyVoucher',
  async (code, { rejectWithValue, getState }) => {
    try {
      // Access the token from the auth state
      const { token } = getState().auth;
      
      // Configure request headers with the authorization token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Use the API_URL variable for the request
      const response = await axios.get(`${API_URL}/buyers/vouchers/code/${code}`, config);
      
      toast.success("Áp dụng mã giảm giá thành công!");
      return response.data;
    } catch (error) {
      // Extract the error message from the server's response
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const voucherSlice = createSlice({
  name: 'voucher',
  initialState: {
    voucher: null,
    loading: false,
    error: null,
  },
  reducers: {
    // Reducer to clear the voucher from the state
    clearVoucher: (state) => {
      state.voucher = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle the pending state of the API call
      .addCase(applyVoucher.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle the fulfilled state (successful API call)
      .addCase(applyVoucher.fulfilled, (state, action) => {
        state.loading = false;
        state.voucher = action.payload;
      })
      // Handle the rejected state (failed API call)
      .addCase(applyVoucher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.voucher = null;
      });
  },
});

export const { clearVoucher } = voucherSlice.actions;

export default voucherSlice.reducer;