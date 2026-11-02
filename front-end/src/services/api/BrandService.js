import { api } from '../index';
class BrandService {
    async getAllBrands() {
        const result = await api.get('/brand');
        return result.data;
    }

    async createBrand(brand) {
        const result = await api.post('/brand', { brand });
        return result.data;
    }
}

export default new BrandService();
