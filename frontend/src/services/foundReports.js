import api from "./api";

export const createFoundReport = (data) =>
  api.post("/found-reports", data).then((r) => r.data);

export const getFoundReports = (params) =>
  api.get("/found-reports", { params }).then((r) => r.data);

export const getFoundReport = (id) =>
  api.get(`/found-reports/${id}`).then((r) => r.data);

export const closeFoundReport = (id) =>
  api.post(`/found-reports/${id}/close`).then((r) => r.data);
