import api from "./axios";

export const getLiabilities = () =>
  api.get("/liabilities").then((r) => r.data);
