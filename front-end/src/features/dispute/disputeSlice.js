import { API_URL } from '../../utils/apiUrl';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';



// Check if an order item is eligible for dispute
export const checkDisputeEligibility = createAsyncThunk(
  'dispute/checkEligibility',
  async (orderItemId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(
        `${API_URL}/buyers/disputes/eligibility/${orderItemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check dispute eligibility');
    }
  }
);

// Create a new dispute
export const createDispute = createAsyncThunk(
  'dispute/createDispute',
  async (disputeData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.post(
        `${API_URL}/buyers/disputes`,
        disputeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.dispute;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create dispute');
    }
  }
);

// Fetch all disputes for the current user
export const fetchUserDisputes = createAsyncThunk(
  'dispute/fetchUserDisputes',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(
        `${API_URL}/buyers/disputes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.disputes;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch disputes');
    }
  }
);

// Fetch single dispute details
export const fetchDisputeDetails = createAsyncThunk(
  'dispute/fetchDisputeDetails',
  async (disputeId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(
        `${API_URL}/buyers/disputes/${disputeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.dispute;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dispute details');
    }
  }
);

// Update a dispute
export const updateDispute = createAsyncThunk(
  'dispute/updateDispute',
  async ({ disputeId, description }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.put(
        `${API_URL}/buyers/disputes/${disputeId}`,
        { description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.dispute;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update dispute');
    }
  }
);

// Cancel a dispute
export const cancelDispute = createAsyncThunk(
  'dispute/cancelDispute',
  async (disputeId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.delete(
        `${API_URL}/buyers/disputes/${disputeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return disputeId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel dispute');
    }
  }
);

const initialState = {
  disputes: [],
  currentDispute: null,
  eligibility: null,
  loading: false,
  error: null,
  success: false
};

const disputeSlice = createSlice({
  name: 'dispute',
  initialState,
  reducers: {
    clearDisputeError: (state) => {
      state.error = null;
    },
    resetDisputeSuccess: (state) => {
      state.success = false;
    },
    clearCurrentDispute: (state) => {
      state.currentDispute = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Check eligibility
      .addCase(checkDisputeEligibility.pending, (state) => {
        state.loading = true;
        state.eligibility = null;
        state.error = null;
      })
      .addCase(checkDisputeEligibility.fulfilled, (state, action) => {
        state.loading = false;
        state.eligibility = action.payload;
      })
      .addCase(checkDisputeEligibility.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to check dispute eligibility');
      })
      
      // Create dispute
      .addCase(createDispute.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createDispute.fulfilled, (state, action) => {
        state.loading = false;
        state.disputes.push(action.payload);
        state.success = true;
        toast.success('Dispute created successfully');
      })
      .addCase(createDispute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to create dispute');
      })
      
      // Fetch user disputes
      .addCase(fetchUserDisputes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDisputes.fulfilled, (state, action) => {
        state.loading = false;
        state.disputes = action.payload;
      })
      .addCase(fetchUserDisputes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch dispute details
      .addCase(fetchDisputeDetails.pending, (state) => {
        state.loading = true;
        state.currentDispute = null;
        state.error = null;
      })
      .addCase(fetchDisputeDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDispute = action.payload;
      })
      .addCase(fetchDisputeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update dispute
      .addCase(updateDispute.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateDispute.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDispute = action.payload;
        state.disputes = state.disputes.map(dispute => 
          dispute._id === action.payload._id ? action.payload : dispute
        );
        state.success = true;
        toast.success('Dispute updated successfully');
      })
      .addCase(updateDispute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to update dispute');
      })
      
      // Cancel dispute
      .addCase(cancelDispute.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(cancelDispute.fulfilled, (state, action) => {
        state.loading = false;
        state.disputes = state.disputes.filter(dispute => dispute._id !== action.payload);
        if (state.currentDispute && state.currentDispute._id === action.payload) {
          state.currentDispute = null;
        }
        state.success = true;
        toast.success('Dispute cancelled successfully');
      })
      .addCase(cancelDispute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to cancel dispute');
      });
  }
});

export const { clearDisputeError, resetDisputeSuccess, clearCurrentDispute } = disputeSlice.actions;

export default disputeSlice.reducer; 