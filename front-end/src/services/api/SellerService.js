import { api } from '../index';

class SellerService {
    // Store profile methods
    async getStoreProfile() {
        try {
            const response = await api.get('seller/store');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async updateStoreProfile(data) {
        try {
            const response = await api.put('seller/store', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async createStore(data) {
        try {
            const response = await api.post('seller/store', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async updateSellerProfile(data) {
        try {
            const response = await api.put('seller/profile', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Products methods
    async getProducts() {
        try {
            const response = await api.get('seller/products');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getProductById(id) {
        try {
            const response = await api.get(`seller/products/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async createProduct(data) {
        try {
            const response = await api.post('seller/products', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async updateProduct(id, data) {
        try {
            const response = await api.put(`seller/products/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const response = await api.delete(`seller/products/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Reviews methods
    async getReviewsByProductId(id) {
        try {
            const response = await api.get(`seller/products/${id}/reviews`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async replyToReview(productId, reviewId, data) {
        try {
            const response = await api.post(`seller/products/${productId}/reviews/${reviewId}/reply`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Order methods
    async getOrderHistory() {
        try {
            const response = await api.get('seller/orders/history');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Disputes methods
    async getDisputes() {
        try {
            const response = await api.get('seller/disputes');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async resolveDispute(id, data) {
        try {
            const response = await api.put(`seller/disputes/${id}/resolve`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Return requests methods
    async getReturnRequests() {
        try {
            const response = await api.get('seller/return-requests');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async updateReturnRequest(id, data) {
        try {
            const response = await api.put(`seller/return-requests/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Report methods
    async getSalesReport(period) {
        try {
            const response = await api.get(`seller/report${period ? `?period=${period}` : ''}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new SellerService(); 