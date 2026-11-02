import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { setCredentials } from '../auth/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999';

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      if (!token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/buyers/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle different response structures
      if (response.data.success && response.data.user) {
        return response.data.user;
      } else if (response.data.data) {
        return response.data.data;
      } else if (response.data._id) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format from server');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk for updating user profile
export const updateUserProfile = createAsyncThunk(
  'profile/updateUserProfile',
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      if (!token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.put(
        `${API_BASE_URL}/api/buyers/profile`,
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.token) dispatch(setCredentials({ token: response.data.token, user: { ...response.data.user, id: response.data.user._id } }));
      // Handle different response structures
      if (response.data.success && response.data.user) {
        return response.data.user;
      } else if (response.data.data) {
        return response.data.data;
      } else if (response.data._id) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format from server');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  user: null,
  loading: false,
  error: null,
  updateSuccess: false,
  updateLoading: false,
  updateError: null
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileErrors: (state) => {
      state.error = null;
      state.updateError = null;
    },
    resetUpdateStatus: (state) => {
      state.updateSuccess = false;
      state.updateError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile cases
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update profile cases
      .addCase(updateUserProfile.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.user = action.payload;
        state.updateSuccess = true;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
        state.updateSuccess = false;
      });
  }
});

export const { clearProfileErrors, resetUpdateStatus } = profileSlice.actions;

export default profileSlice.reducer; 