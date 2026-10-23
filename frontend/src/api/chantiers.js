import apiClient from "./client.js";

export const chantiersApi = {
  getAll: async (params = {}) => {
    return apiClient.get("/chantiers", params);
  },

  getById: async (id) => {
    return apiClient.get(`/chantiers/${id}`);
  },

  create: async (data) => {
    return apiClient.post("/chantiers", data);
  },

  update: async (id, data) => {
    return apiClient.put(`/chantiers/${id}`, data);
  },

  delete: async (id) => {
    return apiClient.delete(`/chantiers/${id}`);
  },
};

export default chantiersApi;
