import { api } from '../index'; // Ensure api is properly configured to handle requests
class AuthenService {
    async register(data) {
        try {
            const response = await api.post('user/register', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async login(data) {
        try {
            const response = await api.post('user/login', data);
            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async forgotPassword(email) {
        try {
            const response = await api.post('user/forgot-password', { email });
            return response.data;
        } catch (error) {
            return error.response.data;
        }
    }

    async resetPassword(token, password) {
        try {
            const response = await api.post(`user/reset-password/${token}`, { password, token });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async verifyEmail(otp, email) {
        try {
            const response = await api.get('user/verify-email', { params: { otp, email } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async resendVerificationEmail(email) {
        try {
            const response = await api.get('user/resend-verification-email', { params: { email } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async updateProfile(data) {
        try {
            const token = localStorage.getItem('token');
            const response = await api.put('user/profile', data, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async changePassword(data) {
        try {
            const response = await api.put('user/change-password', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getProfile() {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`user/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
    async logout() {
        try {
            const token = localStorage.getItem('token');
            // Try to notify the backend about logout
            try {
                await api.post('logout', {}, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });
            } catch (e) {
                console.log('Error during server logout, continuing with local logout', e);
            }
            
            // Clear all auth-related data from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            
            // Clear any session/cookie data if needed
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            return { success: true, message: 'Logged out successfully' };
        } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, try to clear tokens
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            throw error;
        }
    }

    async refreshToken() {
        try {
            const response = await api.post('user/refresh-token', {}, { withCredentials: true });
            if (response.data.accessToken) {
                localStorage.setItem('accessToken', response.data.accessToken);
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    }

}

export default new AuthenService();
