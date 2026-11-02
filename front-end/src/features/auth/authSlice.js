import { createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

// Sửa: Đảm bảo luôn trả về object hợp lệ
const getInitialState = () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      return {
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
        },
        token,
        isAuthenticated: true
      };
    }
  } catch (error) {
    console.error("Lỗi giải mã token:", error);
  }
  
  // Trả về state mặc định nếu có lỗi
  return {
    user: null,
    token: null,
    isAuthenticated: false
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;