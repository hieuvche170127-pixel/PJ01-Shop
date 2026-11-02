// src/services/authService.js
import axios from 'axios';

import { API_URL } from '../utils/apiUrl';

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 
      'Đã xảy ra lỗi khi đăng nhập'
    );
  }
};

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 
      'Đã xảy ra lỗi khi đăng ký'
    );
  }
};

export const forgotPassword = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, data);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 
      'Đã xảy ra lỗi khi yêu cầu khôi phục mật khẩu'
    );
  }
};