// client/src/components/PrivateRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// This component wraps any page that requires login.
// If not authenticated, redirect to /login instead of rendering the page.

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Don't make a routing decision until we've checked localStorage
  // Prevents the login-page-flash bug described in Phase 8
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;
