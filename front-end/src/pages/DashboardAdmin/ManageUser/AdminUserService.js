import { api } from "../../index";

class AdminUserService {
  async getAllUsers(
    page = 1,
    limit = 10,
    search = "",
    roles = [],
    action = ""
  ) {
    try {
      const { data } = await api.get(
        `/api/admin/users?page=${page}&limit=${limit}&search=${search}&role=${roles.join(
          ","
        )}&action=${action}`
      );
      if (data) return data;
    } catch (error) {
      throw new Error(
        error.response ? error.response.data.message : error.message
      );
    }
  }

  async getUserDetails(userId) {
    try {
      const { data } = await api.get(`/api/admin/users/${userId}`);
      if (data) return data;
    } catch (error) {
      throw new Error(
        error.response ? error.response.data.message : error.message
      );
    }
  }

  async updateUserByAdmin(userId, userData) {
    try {
      const { data } = await api.put(`/api/admin/users/${userId}`, userData);
      if (data) return data;
    } catch (error) {
      throw new Error(
        error.response ? error.response.data.message : error.message
      );
    }
  }

  async getAllStores(page = 1, limit = 10, search = "", statuses = []) {
    try {
      const { data } = await api.get(
        `/api/admin/stores?page=${page}&limit=${limit}&search=${search}&status=${statuses.join(
          ","
        )}`
      );
      if (data) return data;
    } catch (error) {
      throw new Error(
        error.response ? error.response.data.message : error.message
      );
    }
  }

  async getStoreDetails(storeId) {
    try {
      const { data } = await api.get(`/api/admin/stores/${storeId}`);
      if (data) return data;
    } catch (error) {
      throw new Error(
        error.response ? error.response.data.message : error.message
      );
    }
  }

  async updateStoreByAdmin(storeId, storeData) {
    try {
      const { data } = await api.put(`/api/admin/stores/${storeId}`, storeData);
      if (data) return data;
    } catch (error) {
      throw new Error(
        error.response ? error.response.data.message : error.message
      );
    }
  }
}

export default new AdminUserService();
