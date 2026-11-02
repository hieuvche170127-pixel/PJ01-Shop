import { api } from '../index';

class OrderService {
  async createOrder(data) {
    try {
      const response = await api.post('/order/create_order', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createPaymentUrl(data) {
    try {
      const response = await api.post('/order/create_payment_url', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }


  async getAllOrders({ page = 1, limit = 10, search, sortField, sortOrder, orderStatus, paymentStatus, paymentMethod }) {
    try {
      const response = await api.get('/order', {
        params: { page, limit, search, sortField, sortOrder, orderStatus, paymentStatus, paymentMethod },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  async getOrdersByUserId(userId, page = 1, limit = 10, startDate, endDate, orderStatus) {
    try {
      const response = await api.get(`/order/user/${userId}`, {
        params: { page, limit, startDate, endDate, orderStatus },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  async getTopSellingProducts() {
    try {
      const result = await api.get('/order/orders/top-selling-products');
      return result.data;
    } catch (error) {
    }
  }
  async updateOrder(orderId, data) {
    try {
      const response = await api.put(`/order/update_order/${orderId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getOrderById(orderId) {
    try {
      const response = await api.get(`/order/detail_order/${orderId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async searchProducts(query) {
    try {
      const response = await api.get(`/product/products/search`, { params: { query } });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getPaginatedAllOrders(page, pageSize, keywords, sortBy) {
    const response = await api.get('/order/get-paginated-orders', {
      params: {
        page,
        pageSize,
        keywords,
        sortBy,
        timestamp: new Date().getTime()
      }
    });
    return response.data;
  }

  async getProfitByMonth(month) {
    const response = await api.get('/order/get-profit', {
      params: {
        month
      }
    });
    return response.data;
  }

  async getAllProfitsByYear(year) {
    const response = await api.get('/order/get-all-profits', {
      params: {
        year
      }
    });
    return response.data;
  }

  async exportProfitsByYear(year) {
    const response = await api.get(`order/export-profits/?year=${year}`, {
      responseType: 'blob',
    });

    // Tạo một URL tạm thời từ blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Yearly_Profit_Report_${year}.xlsx`); // Tên tệp sẽ được tải xuống
    document.body.appendChild(link);
    link.click();
    link.remove(); // Xóa liên kết sau khi tải xuống
  }

  async createOrderPayOS (data) {
    try {
      const response = await api.post('/order/create_order_payos', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async handlePayOSCallback (queryParams) {
    try {
      const response = await api.get(`/order/payos-callback?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new OrderService();
