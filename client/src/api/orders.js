import api from "./axios";

export const checkoutOrder = (orderData) => {
  return api.post("/orders/checkout", orderData);
};

export const getOrders = () => {
  return api.get("/orders");
};

export const updateOrderStatus = (id, status) => {
  return api.patch(`/orders/${id}/status`, { status });
};
