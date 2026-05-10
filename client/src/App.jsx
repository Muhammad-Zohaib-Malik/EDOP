import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import HomePage from "./pages/HomePage";
import Navbar from "./components/Navbar";
import CartSidebar from "./components/CartSidebar";

import "./App.css";

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: (
      <>
        <Navbar />
        <HomePage />
      </>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <Navbar />
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <RouterProvider router={router} />
        <CartSidebar />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
