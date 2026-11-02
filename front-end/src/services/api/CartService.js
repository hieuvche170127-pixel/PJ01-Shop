import { api } from '../index';

class CartService {
  async getAllProducts(userId) {
    try {
      const { data } = await api.get(`/cart/${userId}`);
      if (data) return data;
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }

  async updateCartItem(userId, productId, quantity, color) {
    try {
      const { data } = await api.put('/cart/update', {
        userId,
        productId,
        quantity,
        color
      });
      return data;
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }

  async addToCartItem(userId, productId, quantity, color) {
    try {
      const { data } = await api.post('/cart/add-to-cart', {
        userId,
        productId,
        quantity,
        color
      });
      return data;
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }

  async deleteCartItem(userId, productId, color) {
    try {
      const { data } = await api.delete('/cart/remove', {
        data: {
          userId,
          productId,
          color
        }
      });
      return data;
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }
}

export default new CartService();
