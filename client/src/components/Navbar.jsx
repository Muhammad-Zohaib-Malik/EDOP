import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItemCount, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "tween", duration: 0.5 }}
      className="absolute top-0 z-50 w-full bg-transparent"
    >
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#3b82f6] text-white flex items-center justify-center font-display font-bold text-xl rounded-md">
            M
          </div>
          <span className="font-display text-xl font-bold text-slate-900 tracking-tight">
            ModernStore.
          </span>
        </Link>
        
        <div className="hidden md:flex gap-10 items-center absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="font-sans text-sm font-medium text-[#3b82f6] transition-colors">
            Collections
          </Link>
          <Link to="/" className="font-sans text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Men
          </Link>
          <Link to="/" className="font-sans text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Women
          </Link>
        </div>
        
        <div className="flex gap-6 items-center">
          <button className="text-slate-600 hover:text-slate-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCartOpen(true)}
            className="relative text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartItemCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={cartItemCount}
                className="absolute -top-1.5 -right-2 bg-[#ef4444] text-white text-[10px] font-sans font-bold h-4 w-4 flex items-center justify-center rounded-full"
              >
                {cartItemCount}
              </motion.span>
            )}
          </motion.button>

          {user?.role === "admin" && (
            <div className="flex items-center gap-6 ml-4 border-l border-slate-200 pl-6">
              <Link 
                to="/admin" 
                className="font-sans text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="font-sans text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
