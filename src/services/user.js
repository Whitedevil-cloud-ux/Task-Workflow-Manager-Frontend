import api from "./api";

export const getMe = () => api.get("/users/me");