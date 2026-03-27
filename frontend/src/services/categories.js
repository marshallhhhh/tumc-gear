import api from "./api";

export const getCategories = () => api.get("/categories").then((r) => r.data);

export const createCategory = (data) =>
  api.post("/categories", data).then((r) => r.data);

export const updateCategory = (id, data) =>
  api.patch(`/categories/${id}`, data).then((r) => r.data);

export const deleteCategory = (id) => api.delete(`/categories/${id}`);
