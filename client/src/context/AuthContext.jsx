import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, logoutUser, getProfile } from "../api/auth";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await getProfile();
        setUser(res.data.profile);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await registerUser(data);
    return res.data;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
