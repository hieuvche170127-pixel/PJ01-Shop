import { api } from '../index';

class UserService {
    async addUser(email, password, fullName, address, phoneNumber) {
        const result = await api.post(`/user/register`, { email, password, fullName, address, phoneNumber });
        return result.data;
    }

    async getPaginatedUsers(page, pageSize, keywords, sortBy) {
        const response = await api.get('/user/get-paginated-users', {
            params: {
                page,
                pageSize,
                keywords,
                sortBy
            }
        });
        return response.data;
    }

    async changeRole(role) {
        try {
            const result = await api.put('/buyers/change-role', { role });
            return result.data;
        } catch (error) {
            throw error;
        }
    }

    async updateUser(userId, email, fullName, address, phoneNumber, role, isVerified) {
        const result = await api.put(`/user/update/${userId}`, { email, fullName, address, phoneNumber, role, isVerified });
        return result.data;
    }

}

export default new UserService();
