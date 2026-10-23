import apiClient from "./client.js";

export const materialsApi = {
  getAll: async (params = {}) => {
    return apiClient.get("/materials", params);
  },

  getById: async (id) => {
    return apiClient.get(`/materials/${id}`);
  },

  create: async (data) => {
    return apiClient.post("/materials", data);
  },

  update: async (id, data) => {
    return apiClient.put(`/materials/${id}`, data);
  },

  delete: async (id) => {
    return apiClient.delete(`/materials/${id}`);
  },
};

export default materialsApi;
