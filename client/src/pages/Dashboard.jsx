// client/src/pages/Dashboard.jsx — confirm this is what you have

import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#FBFAF8] p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-gray-800">
            Hi {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's how this month is looking
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-lg"
        >
          Log out
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Spent this month" value={14350} prefix="₹" />
        <StatCard
          label="Budget left"
          value={650}
          prefix="₹"
          valueColor="text-[#0D6E6E]"
        />
        <StatCard label="Transactions" value={18} />
      </div>
    </div>
  );
}

export default Dashboard;
