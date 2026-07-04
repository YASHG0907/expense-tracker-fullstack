// client/src/pages/Dashboard.jsx

import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm"
        >
          Logout
        </button>
      </div>
      <p className="mt-4 text-gray-400">Welcome, {user?.name}</p>
      <p className="text-gray-500 text-sm mt-1">
        Full dashboard built Day 11–12
      </p>
    </div>
  );
}

export default Dashboard;
