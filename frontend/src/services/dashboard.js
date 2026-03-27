import api from "./api";

export const getDashboardStats = () =>
  api.get("/dashboard").then((r) => r.data);
