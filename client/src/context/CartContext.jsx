import { createContext, useState, useContext, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState(() => {
    // Load initial cart state from local storage if available
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save to local storage whenever cart changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        // If product already exists in cart, check stock before incrementing
        if (existingItem.quantity >= product.stock) {
          toast.error(`Cannot add more. Only ${product.stock} in stock.`);
          return prevCart;
        }

        toast.success(`Added another ${product.name} to cart!`);
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        // If product is new to cart
        if (product.stock <= 0) {
          toast.error(`${product.name} is out of stock.`);
          return prevCart;
        }

        toast.success(`${product.name} added to cart!`);
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    toast.success("Item removed from cart");
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
    toast.success("Cart cleared");
  };

  const cartTotal = useMemo(() => 
    cart.reduce((total, item) => total + item.price * item.quantity, 0),
  [cart]);
  
  const cartItemCount = useMemo(() => 
    cart.reduce((count, item) => count + item.quantity, 0),
  [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
