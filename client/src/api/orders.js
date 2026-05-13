import api from "./axios";

export const checkoutOrder = (orderData) => api.post("/orders/checkout", orderData);
export const getOrders = () => api.get("/orders");
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });

// Elasticsearch fuzzy search
export const searchOrders = (q, status) =>
  api.get("/orders/search", { params: { q, status } });
