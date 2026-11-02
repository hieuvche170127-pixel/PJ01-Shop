import { api } from '../index';
import { BACKEND_API_URI } from '../../utils/constants';

class ReviewService {
    async createReview(review) {
        const token = localStorage.getItem('accessToken');
        return api.post(`${BACKEND_API_URI}/review/create_review`, review, {
            headers: { Authorization: `Bearer ${token}` },
        });
    }

    async getReviews() {
        return api.get(`${BACKEND_API_URI}/review/get_reviews`);
    }

    async getReview(reviewId) {
        return api.get(`${BACKEND_API_URI}/review/get_review/${reviewId}`);
    }

    async getReviewsByProduct(productId) {
        return api.get(`${BACKEND_API_URI}/review/get_reviews_by_product/${productId}`);
    }

    async getReviewsByUser(userId) {
        return api.get(`${BACKEND_API_URI}/review/get_reviews_by_user/${userId}`);
    }

    async updateReview(reviewId, review) {
        const token = localStorage.getItem('accessToken');
        return api.put(`${BACKEND_API_URI}/review/update_review/${reviewId}`, review, {
            headers: { Authorization: `Bearer ${token}` },
        });
    }

    async deleteReview(reviewId) {
        const token = localStorage.getItem('accessToken');
        return api.delete(`${BACKEND_API_URI}/review/delete_review/${reviewId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    }
    async getReviewSummary(productId) {
        return api.get(`${BACKEND_API_URI}/review/review_summary/${productId}`);
    }
}

export default new ReviewService();
