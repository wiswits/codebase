import axiosClient from "./axiosClient";

export const authApi = {
  login: (data) => axiosClient.post("/auth/login", data),
  register: (data) => axiosClient.post("/auth/register", data),
  me: () => axiosClient.get("/auth/me"),
};

export const dashboardApi = {
  get: () => axiosClient.get("/dashboard"),
};

export const categoryApi = {
  list: (params) => axiosClient.get("/categories", { params }),
  get: (id) => axiosClient.get(`/categories/${id}`),
  create: (data) => axiosClient.post("/categories", data),
  update: (id, data) => axiosClient.put(`/categories/${id}`, data),
  remove: (id) => axiosClient.delete(`/categories/${id}`),
};

export const vendorApi = {
  list: (params) => axiosClient.get("/vendors", { params }),
  get: (id) => axiosClient.get(`/vendors/${id}`),
  history: (id) => axiosClient.get(`/vendors/${id}/purchases`),
  create: (data) => axiosClient.post("/vendors", data),
  update: (id, data) => axiosClient.put(`/vendors/${id}`, data),
  remove: (id) => axiosClient.delete(`/vendors/${id}`),
};

export const productApi = {
  list: (params) => axiosClient.get("/products", { params }),
  get: (id) => axiosClient.get(`/products/${id}`),
  lowStock: () => axiosClient.get("/products/low-stock"),
  create: (data) => axiosClient.post("/products", data),
  update: (id, data) => axiosClient.put(`/products/${id}`, data),
  remove: (id) => axiosClient.delete(`/products/${id}`),
};

export const purchaseApi = {
  list: () => axiosClient.get("/purchases"),
  get: (id) => axiosClient.get(`/purchases/${id}`),
  create: (data) => axiosClient.post("/purchases", data),
};

export const stockInApi = {
  history: () => axiosClient.get("/stock-in"),
  create: (data) => axiosClient.post("/stock-in", data),
};

export const stockOutApi = {
  list: () => axiosClient.get("/stock-out"),
  get: (id) => axiosClient.get(`/stock-out/${id}`),
  create: (data) => axiosClient.post("/stock-out", data),
};

export const returnApi = {
  list: () => axiosClient.get("/returns"),
  create: (data) => axiosClient.post("/returns", data),
};

export const historyApi = {
  list: (params) => axiosClient.get("/inventory-history", { params }),
};

export const notificationApi = {
  list: () => axiosClient.get("/notifications"),
  markRead: (id) => axiosClient.put(`/notifications/${id}/read`),
  markAllRead: () => axiosClient.put("/notifications/read-all"),
  remove: (id) => axiosClient.delete(`/notifications/${id}`),
};

export const userApi = {
  list: (params) => axiosClient.get("/users", { params }),
  get: (id) => axiosClient.get(`/users/${id}`),
  create: (data) => axiosClient.post("/users", data),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  remove: (id) => axiosClient.delete(`/users/${id}`),
};

export const reportApi = {
  summary: () => axiosClient.get("/reports/summary"),
  stock: () => axiosClient.get("/reports/stock"),
  purchases: (params) => axiosClient.get("/reports/purchases", { params }),
  issues: (params) => axiosClient.get("/reports/issues", { params }),
  returns: (params) => axiosClient.get("/reports/returns", { params }),
  vendors: () => axiosClient.get("/reports/vendors"),
};
