import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { checkoutOrder } from "../api/orders";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const CartSidebar = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
  } = useCart();
  const { user } = useAuth();

  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [formData, setFormData] = useState({
    customerName: user?.name || "",
    customerPhone: "",
    customerAddress: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent scrolling on body when sidebar is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  // Reset checkout mode when closed
  useEffect(() => {
    if (!isCartOpen) setIsCheckoutMode(false);
  }, [isCartOpen]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!formData.customerName) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.customerAddress) {
      toast.error("Please enter your delivery address");
      return;
    }

    setIsSubmitting(true);
    try {
      const items = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      await checkoutOrder({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        items,
      });

      clearCart();
      toast.success("Order placed successfully!");
      setIsCartOpen(false);
      setIsCheckoutMode(false);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Checkout failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "tween",
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="absolute inset-y-0 right-0 max-w-md w-full flex"
          >
            <div className="w-full h-full bg-white flex flex-col relative z-10 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]">
              {/* Header */}
              <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-100">
                <h2 className="font-display font-semibold text-xl text-slate-900">
                  Shopping Cart
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 bg-white">
                {cart.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full text-slate-400 gap-4"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                        <path d="M3 6h18" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                    </div>
                    <p className="font-sans text-sm text-slate-500 font-medium">
                      Your cart is currently empty.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-2 px-6 py-2.5 font-sans text-sm font-medium bg-[#3b82f6] text-white rounded-md hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                    >
                      Start Shopping
                    </button>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        layout
                        className="flex gap-4 pb-6 border-b border-slate-100 relative group"
                      >
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 p-2">
                          {item.picture ? (
                            <img
                              src={`http://localhost:5002/uploads/${item.picture}`}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-300">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex justify-between items-start pr-6">
                              <h3 className="font-display font-medium text-sm text-slate-900 leading-tight">
                                {item.name}
                              </h3>
                            </div>
                            <p className="font-sans font-bold text-sm text-[#3b82f6] mt-1">
                              Rs {parseFloat(item.price).toLocaleString()}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 bg-slate-50 rounded-md px-2 py-1">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                disabled={item.quantity <= 1}
                                className="text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M5 12h14" />
                                </svg>
                              </button>
                              <span className="font-sans text-xs font-semibold text-slate-900 w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                disabled={item.quantity >= item.stock}
                                className="text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M5 12h14" />
                                  <path d="M12 5v14" />
                                </svg>
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer / Checkout */}
              {cart.length > 0 && (
                <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                  <AnimatePresence mode="wait">
                    {!isCheckoutMode ? (
                      <motion.div
                        key="cart-summary"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-sans text-slate-500 font-medium">
                            Total amount
                          </span>
                          <span className="font-display font-bold text-2xl text-slate-900">
                            Rs {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-6">
                          Taxes and shipping calculated at checkout
                        </p>

                        <button
                          onClick={() => setIsCheckoutMode(true)}
                          className="w-full font-sans font-medium bg-[#3b82f6] hover:bg-blue-600 text-white rounded-md py-3.5 transition-colors shadow-lg shadow-blue-500/20 mb-3 cursor-pointer"
                        >
                          Checkout Securely
                        </button>

                        <button
                          onClick={clearCart}
                          className="w-full py-2 font-sans text-sm font-medium text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          Empty Cart
                        </button>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="checkout-form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleCheckout}
                      >
                        <div className="mb-4">
                          <label className="block font-sans text-sm font-medium text-slate-700 mb-1.5">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.customerName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customerName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all font-sans text-sm text-slate-900 placeholder-slate-400"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block font-sans text-sm font-medium text-slate-700 mb-1.5">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.customerPhone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customerPhone: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all font-sans text-sm text-slate-900 placeholder-slate-400"
                            placeholder="+1 234 567 890"
                          />
                        </div>
                        <div className="mb-6">
                          <label className="block font-sans text-sm font-medium text-slate-700 mb-1.5">
                            Delivery Address
                          </label>
                          <textarea
                            required
                            rows="2"
                            value={formData.customerAddress}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customerAddress: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all resize-none font-sans text-sm text-slate-900 placeholder-slate-400"
                            placeholder="123 Main St, City"
                          />
                        </div>

                        <div className="flex justify-between items-center mb-6 pt-5 border-t border-slate-200">
                          <span className="font-sans font-medium text-slate-500">
                            Total
                          </span>
                          <span className="font-display font-bold text-2xl text-slate-900">
                            Rs {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <button
                          disabled={isSubmitting}
                          type="submit"
                          className="w-full font-sans font-medium bg-[#3b82f6] hover:bg-blue-600 text-white rounded-md py-3.5 transition-colors shadow-lg shadow-blue-500/20 mb-3 cursor-pointer disabled:bg-slate-300 disabled:shadow-none"
                        >
                          {isSubmitting ? "Processing..." : "Place Order"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsCheckoutMode(false)}
                          className="w-full py-2 font-sans text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          Back to Selection
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
