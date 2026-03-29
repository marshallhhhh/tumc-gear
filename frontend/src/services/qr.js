import api from "./api";

export const resolveQr = (nanoid) =>
  api.post("/qr/resolve", { nanoid }).then((r) => r.data);

export const createQr = (nanoid) =>
  api.post("/qr", { nanoid }).then((r) => r.data);

export const getQrTags = (params) =>
  api.get("/qr", { params }).then((r) => r.data);

export const assignQr = (nanoid, itemId, { force, currentItemId } = {}) =>
  api.post("/qr/assign", { nanoid, itemId, force, currentItemId }).then((r) => r.data);

export const unassignQr = (id) =>
  api.delete(`/qr/${id}/assign`).then((r) => r.data);
