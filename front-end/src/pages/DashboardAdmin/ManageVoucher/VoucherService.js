import { API_ORIGIN } from '../../../utils/apiUrl';
import axios from 'axios';

class VoucherService {
  constructor() {
    this.baseURL = `${API_ORIGIN}/api/admin/vouchers`;

  }

  get token() { return localStorage.getItem('accessToken') || ''; }

  // Lấy tất cả voucher
  async getAllVouchers() {
    try {
      const response = await axios.get(this.baseURL, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Unknown error';
      console.error(`HTTP Status: ${status}, Message: ${message}`);
      throw error;
    }
  }

  // Lấy chi tiết voucher theo id
  async getVoucherById(id) {
    try {
      const response = await axios.get(`${this.baseURL}/${id}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching voucher ${id}:`, error);
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Unknown error';
      console.error(`HTTP Status: ${status}, Message: ${message}`);
      throw error;
    }
  }

  // Tạo voucher mới
  async createVoucher(voucherData) {
    try {
      const response = await axios.post(this.baseURL, voucherData, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating voucher:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Unknown error';
      console.error(`HTTP Status: ${status}, Message: ${message}`);
      throw error;
    }
  }

  // Cập nhật voucher
  async updateVoucher(id, voucherData) {
    try {
      const response = await axios.put(`${this.baseURL}/${id}`, voucherData, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating voucher ${id}:`, error);
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Unknown error';
      console.error(`HTTP Status: ${status}, Message: ${message}`);
      throw error;
    }
  }

  // Xóa voucher
  async deleteVoucher(id) {
    try {
      const response = await axios.delete(`${this.baseURL}/${id}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting voucher ${id}:`, error);
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Unknown error';
      console.error(`HTTP Status: ${status}, Message: ${message}`);
      throw error;
    }
  }

  // Bật/tắt trạng thái voucher
  async toggleVoucherStatus(id) {
    try {
      const response = await axios.put(`${this.baseURL}/${id}/toggle-active`, {}, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling voucher status ${id}:`, error);
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Unknown error';
      console.error(`HTTP Status: ${status}, Message: ${message}`);
      throw error;
    }
  }

  // Refresh token if needed
  refreshToken() {
    this.token = localStorage.getItem('accessToken') || '';
  }
}

export default new VoucherService(); 