import apiClient, { setToken, removeToken } from "./client.js";

export const authApi = {
  login: async (email, password) => {
    const data = await apiClient.post("/auth/login", { email, password });
    if (data?.token) {
      setToken(data.token);
    }
    return data;
  },

  getMe: async () => {
    return apiClient.get("/auth/me");
  },

  getManagers: async () => {
    return apiClient.get("/auth/managers");
  },

  register: async (userData) => {
    return apiClient.post("/auth/register", userData);
  },

  logout: () => {
    removeToken();
  },
};

export default authApi;
