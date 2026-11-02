import { api } from '../index';
import { BACKEND_API_URI } from '../../utils/constants';

class ProductService {
    async getAllProducts() {
        const result = await api.get('/product');
        return result.data;
    }

    async getPaginatedProducts(page, pageSize, keywords, sortBy) {
        const response = await api.get('/product/get-paginated-products', {
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

    async getAllDeletedProducts(page, pageSize) {
        const result = await api.get(`/product/get-deleted-products`);
        return result.data;
    }

    async addProduct(name, description, brand, category, price, cost, isAvailable, specs, instock, images) {
        const formData = new FormData();
        // Append other fields
        formData.append('name', name);
        formData.append('description', description);
        formData.append('brand', brand);
        formData.append('category', category);
        formData.append('price', price);
        formData.append('cost', cost);
        formData.append('isAvailable', isAvailable);

        // Append specs and instock arrays
        formData.append('specs', JSON.stringify(specs));
        formData.append('inStock', JSON.stringify(instock));
        if (images) {
            for (let i = 0; i < images.length; i++) {
                formData.append('images', images[i]);
            }
        }

        return await api.post('/product', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

    }

    async updateProduct(productId, name, description, brand, category, price, cost, isAvailable, specs, instock, images) {
        const formData = new FormData();
        // Append other fields
        formData.append('name', name);
        formData.append('description', description);
        formData.append('brand', brand);
        formData.append('category', category);
        formData.append('price', price);
        formData.append('cost', cost);
        formData.append('isAvailable', isAvailable);

        // Append specs and instock arrays
        formData.append('specs', JSON.stringify(specs));
        formData.append('inStock', JSON.stringify(instock));
        if (images) {
            for (let i = 0; i < images.length; i++) {
                formData.append('images', images[i]);
            }
        }

        return await api.put(`/product/update/${productId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

    }

    async softDeleteProduct(productId) {
        const result = await api.delete(`/product/soft-delete/${productId}`);
        return result.data;
    }

    getImage(filename) {
        return `${BACKEND_API_URI}/product/get-image/${filename}`;
    }

    async getProductById(productId) {
        const result = await api.get(`/product/${productId}`);
        return result.data;
    }

    async getNewArrivals() {
        const result = await api.get('/product/products/new-arrivals');
        return result.data;
    }
    async getProductsSortedByPriceAscending() {
        try {
            const result = await api.get('/product/price/desc');
            return result.data;
        } catch (error) {
            console.log(error)
        }
    }
    async getProductsSortedByPriceDescending() {
        try {
            const result = await api.get('/product/price/asc');
            return result.data;
        } catch (error) {
            console.log(error)
        }
    }
}

export default new ProductService();
