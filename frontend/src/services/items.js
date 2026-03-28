import api from "./api";

export const getItems = (params) =>
  api.get("/items", { params }).then((r) => r.data);

export const getItemById = (id, params) =>
  api.get(`/item/${id}`, { params }).then((r) => r.data);

export const createItem = (data) => api.post("/item", data).then((r) => r.data);

export const updateItem = (id, data) =>
  api.patch(`/item/${id}`, data).then((r) => r.data);

export const deleteItem = (id) => api.delete(`/item/${id}`);
