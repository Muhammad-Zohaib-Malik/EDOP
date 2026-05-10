import { useState, useEffect } from "react";
import { getProducts } from "../api/products";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getProducts();
        setProducts(res.data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xl font-medium text-slate-400">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mr-3"
        />
        Loading amazing products...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Modern Hero Section */}
      <section className="relative w-full overflow-hidden bg-[#f4f7fb] pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 min-h-[70vh]">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-start pt-10"
          >
            <span className="inline-block text-slate-500 font-sans font-medium mb-3">
              Summer Collections
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-6">
              New Casual <br />
              <span className="text-slate-900">Collection</span>
            </h1>
            <p className="font-sans text-slate-500 max-w-md mb-8 leading-relaxed">
              Discover our latest drops designed for maximum comfort and style.
              Perfect for your everyday wardrobe.
            </p>
            <div className="flex items-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  document
                    .getElementById("products-section")
                    .scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#3b82f6] text-white px-8 py-3.5 rounded-md font-sans font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
              >
                Shop Now
              </motion.button>

              {/* Fake small widget to mimic the design */}
              <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                  ⭐
                </span>
                <span className="font-sans text-sm font-semibold">
                  4.9 / 5.0
                </span>
              </div>
            </div>
          </motion.div>

          {/* Image Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="relative h-full flex items-center justify-center"
          >
            {/* Background Blob/Circle */}
            <div className="absolute w-[400px] h-[400px] bg-[#e0f2fe] rounded-full mix-blend-multiply filter blur-2xl opacity-70 right-0 top-1/2 -translate-y-1/2"></div>
            <div className="absolute w-[300px] h-[300px] bg-[#dbeafe] rounded-full top-10 left-10"></div>

            {/* Model Image */}
            <img
              src="/modern-model.png"
              alt="Model"
              className="relative z-10 h-[600px] object-cover drop-shadow-2xl mix-blend-darken"
            />

            {/* Floating Price Tag Mimic */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute right-10 bottom-20 bg-white p-4 rounded-xl shadow-xl z-20 w-48 hidden lg:block border border-slate-100"
            >
              <div className="flex gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-black"></div>
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              </div>
              <p className="font-sans text-xs text-slate-500 mb-1">
                Color:{" "}
                <span className="font-semibold text-slate-900">Black</span>
              </p>
              <p className="font-display font-bold text-xl text-slate-900">Rs {parseFloat(4900).toLocaleString()}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <div id="products-section" className="max-w-7xl mx-auto px-6 pt-24">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">
            Our Products
          </h2>
          <p className="text-slate-500 font-sans">Handpicked items for you</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-xl border border-slate-100">
            <p className="font-sans text-slate-500">
              No products found. Check back later!
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                className="group flex flex-col bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300 relative"
              >
                {/* Image Container */}
                <div className="aspect-square bg-slate-50 relative p-4">
                  {product.picture ? (
                    <img
                      src={`http://localhost:5002/uploads/${product.picture}`}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-sans text-sm text-slate-400">
                      No Image
                    </div>
                  )}

                  {/* Styled Badge */}
                  {product.stock <= 0 && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-2 py-1 text-[10px] font-sans font-bold uppercase rounded-sm text-white bg-[#ef4444]">
                        Sold Out
                      </span>
                    </div>
                  )}

                  {/* Overlay Action Buttons */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-10">
                    <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-600 hover:text-[#3b82f6] shadow-md">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content Container */}
                <div className="flex flex-col p-5 bg-white text-center">
                  <h3 className="font-display font-semibold text-slate-900 mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex justify-center items-center gap-3 mb-4">
                    <span className="font-sans font-bold text-[#3b82f6]">Rs {parseFloat(product.price).toLocaleString()}</span>
                  </div>

                  {/* Add to cart button */}
                  <button
                    disabled={product.stock <= 0}
                    onClick={() => addToCart(product)}
                    className="w-full font-sans font-medium bg-[#f4f7fb] text-slate-700 hover:bg-[#3b82f6] hover:text-white py-2.5 rounded-md transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
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
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
