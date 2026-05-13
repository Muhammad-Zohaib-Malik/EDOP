import api from "./axios";

export const getProducts = () => api.get("/products");
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (formData) =>
  api.post("/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateProduct = (id, formData) =>
  api.put(`/products/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Elasticsearch fuzzy search
export const searchProducts = (q) => api.get("/products/search", { params: { q } });
