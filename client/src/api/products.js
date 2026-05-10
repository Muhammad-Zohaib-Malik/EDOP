import api from "./axios";

export const getProducts = () => {
  return api.get("/products");
};

export const getProductById = (id) => {
  return api.get(`/products/${id}`);
};

export const createProduct = (formData) => {
  return api.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateProduct = (id, formData) => {
  return api.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteProduct = (id) => {
  return api.delete(`/products/${id}`);
};
