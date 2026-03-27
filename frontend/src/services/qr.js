import api from "./api";

export const resolveQr = (nanoid) =>
  api.post("/qr/resolve", { nanoid }).then((r) => r.data);

export const createQr = (nanoid) =>
  api.post("/qr", { nanoid }).then((r) => r.data);

export const getQrTags = (params) =>
  api.get("/qr", { params }).then((r) => r.data);

export const assignQr = (nanoid, itemId) =>
  api.post("/qr/assign", { nanoid, itemId }).then((r) => r.data);

export const unassignQr = (id) =>
  api.delete(`/qr/${id}/assign`).then((r) => r.data);
