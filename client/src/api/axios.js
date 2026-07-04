// client/src/api/axios.js

import axios from "axios";

// Create a configured axios instance instead of using raw axios everywhere
// baseURL means you write api.get('/expenses') instead of
// api.get('http://localhost:5000/api/expenses') every single time

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── REQUEST INTERCEPTOR ─────────────────────────────────────
// Runs BEFORE every single request is sent.
// Automatically attaches the JWT token from localStorage
// so you never have to manually add it to each API call.

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────
// Runs AFTER every response comes back.
// If the backend says the token is invalid/expired (401),
// automatically log the user out and redirect to login.
// Prevents the app from staying in a broken "logged in but token dead" state.

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if we're not already on the login page
      // (prevents an infinite redirect loop)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
