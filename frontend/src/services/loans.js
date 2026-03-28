import api from "./api";

export const createLoan = (data) =>
  api.post("/loans", data).then((r) => r.data);

export const getLoans = (params) =>
  api.get("/loans", { params }).then((r) => r.data);

export const getMyLoans = (params) =>
  api.get("/loans/my", { params }).then((r) => r.data);

export const returnLoan = (id, data) =>
  api.post(`/loans/${id}/return`, data).then((r) => r.data);

export const cancelLoan = (id) =>
  api.post(`/loans/${id}/cancel`).then((r) => r.data);

export const extendLoan = (id, data) =>
  api.patch(`/loans/${id}/extend`, data).then((r) => r.data);
