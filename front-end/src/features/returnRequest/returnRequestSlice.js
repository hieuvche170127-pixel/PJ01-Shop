import { API_URL } from '../../utils/apiUrl';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';



// Create return request
export const createReturnRequest = createAsyncThunk(
  'returnRequest/createReturnRequest',
  async ({ orderItemId, reason }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.post(
        `${API_URL}/buyers/return-requests`,
        { orderItemId, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Return request created successfully');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create return request';
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch user return requests
export const fetchUserReturnRequests = createAsyncThunk(
  'returnRequest/fetchUserReturnRequests',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(
        `${API_URL}/buyers/return-requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch return requests';
      return rejectWithValue(errorMessage);
    }
  }
);

// Get return request details
export const getReturnRequestDetail = createAsyncThunk(
  'returnRequest/getReturnRequestDetail',
  async (requestId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(
        `${API_URL}/buyers/return-requests/${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get return request details';
      return rejectWithValue(errorMessage);
    }
  }
);

// Cancel return request
export const cancelReturnRequest = createAsyncThunk(
  'returnRequest/cancelReturnRequest',
  async (requestId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      await axios.delete(
        `${API_URL}/buyers/return-requests/${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Return request cancelled successfully');
      return requestId;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel return request';
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const returnRequestSlice = createSlice({
  name: 'returnRequest',
  initialState: {
    requests: [],
    currentRequest: null,
    loading: false,
    error: null,
    success: false
  },
  reducers: {
    clearCurrentRequest: (state) => {
      state.currentRequest = null;
    },
    clearReturnRequestState: (state) => {
      state.success = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create return request
      .addCase(createReturnRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReturnRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.requests.unshift(action.payload);
      })
      .addCase(createReturnRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch user return requests
      .addCase(fetchUserReturnRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReturnRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchUserReturnRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get return request details
      .addCase(getReturnRequestDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReturnRequestDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRequest = action.payload;
      })
      .addCase(getReturnRequestDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Cancel return request
      .addCase(cancelReturnRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelReturnRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = state.requests.filter(request => request._id !== action.payload);
      })
      .addCase(cancelReturnRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCurrentRequest, clearReturnRequestState } = returnRequestSlice.actions;
export default returnRequestSlice.reducer; 