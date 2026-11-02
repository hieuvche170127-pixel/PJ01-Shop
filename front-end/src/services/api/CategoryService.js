import { api } from '../index';
class CategoryService {
    async getAllCategories() {
        const result = await api.get('/category');
        return result.data;
    }

    async createCategory(category) {
        const result = await api.post('/category', { category });
        return result.data;
    }

}

export default new CategoryService();
