// client/src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from "react";

// Create the context object — think of this as a "channel"
// that any component can tune into to read/update auth state
const AuthContext = createContext();

// Custom hook — components call useAuth() instead of
// importing useContext and AuthContext separately every time
export const useAuth = () => useContext(AuthContext);

// The Provider wraps your entire app and makes auth state
// available to every component nested inside it

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first app load, check if there's a saved session in localStorage
  // This is what keeps a user logged in even after refreshing the page
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false); // done checking, safe to render the app now
  }, []);

  // Called after a successful login or register API response
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // Called when user clicks logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user, // shorthand boolean, true if user exists
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
