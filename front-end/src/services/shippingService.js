import { API_URL } from '../utils/apiUrl';
import axios from 'axios';



/**
 * Cập nhật status của OrderItem
 * @param {Object} data - Dữ liệu cập nhật { orderItemId, status }
 * @param {String} token - JWT token
 * @returns {Promise}
 */
export const updateOrderItemStatus = async (data, token) => {
  try {
    console.log('Calling updateOrderItemStatus with data:', data);
    const response = await axios.put(`${API_URL}/sellers/order-items/status`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('updateOrderItemStatus error:', error);
    throw new Error(
      error.response?.data?.message || 
      'Đã xảy ra lỗi khi cập nhật trạng thái sản phẩm'
    );
  }
};

/**
 * Cập nhật status của ShippingInfo và OrderItem tương ứng
 * @param {Object} data - Dữ liệu cập nhật { shippingInfoId, status, trackingNumber, estimatedArrival }
 * @param {String} token - JWT token
 * @returns {Promise}
 */
export const updateShippingStatus = async (data, token) => {
  try {
    console.log('Calling updateShippingStatus with data:', data);
    const response = await axios.put(`${API_URL}/sellers/shipping/status`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('updateShippingStatus error:', error);
    throw new Error(
      error.response?.data?.message || 
      'Đã xảy ra lỗi khi cập nhật thông tin vận chuyển'
    );
  }
};

/**
 * Lấy thông tin vận chuyển của một OrderItem
 * @param {String} orderItemId - ID của OrderItem
 * @param {String} token - JWT token
 * @returns {Promise}
 */
export const getShippingInfoByOrderItem = async (orderItemId, token) => {
  try {
    console.log('Fetching shipping info for orderItem:', orderItemId);
    const response = await axios.get(`${API_URL}/sellers/shipping/order-item/${orderItemId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('getShippingInfoByOrderItem error:', error);
    if (error.response?.status === 404) {
      return { shippingInfo: null, orderItem: null };
    }
    throw new Error(
      error.response?.data?.message || 
      'Đã xảy ra lỗi khi lấy thông tin vận chuyển'
    );
  }
};

/**
 * Lấy danh sách thông tin vận chuyển của một Order
 * @param {String} orderId - ID của Order
 * @param {String} token - JWT token
 * @returns {Promise}
 */
export const getShippingInfoByOrder = async (orderId, token) => {
  try {
    console.log('Fetching shipping info for order:', orderId);
    const response = await axios.get(`${API_URL}/sellers/shipping/order/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('getShippingInfoByOrder response:', response.data);
    return response.data;
  } catch (error) {
    console.error('getShippingInfoByOrder error:', error);
    // Trả về cấu trúc mặc định để component không bị lỗi
    if (error.response?.status === 404) {
      return { items: [] };
    }
    throw new Error(
      error.response?.data?.message || 
      'Đã xảy ra lỗi khi lấy thông tin vận chuyển của đơn hàng'
    );
  }
}; 