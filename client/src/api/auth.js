import api from "./axios";

export const registerUser = (data) => {
  return api.post("/auth/register", data);
};

export const loginUser = (data) => {
  return api.post("/auth/login", data);
};

export const logoutUser = () => {
  return api.post("/auth/logout");
};

export const refreshToken = () => {
  return api.post("/auth/refresh");
};

export const getProfile = () => {
  return api.get("/auth/profile");
};

export const getAllUsers = () => {
  return api.get("/auth/all");
};
