// client/src/pages/Dashboard.jsx

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import CategoryPieChart from "../components/CategoryPieChart";
import AnomalyBanner from "../components/AnomalyBanner";
import BudgetProgressBar from "../components/BudgetProgressBar";
import api from "../api/axios";

function Dashboard() {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/analytics/dashboard");
        setDashboardData(response.data.data);
      } catch (err) {
        toast.error("Could not load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-[#FBFAF8] flex items-center justify-center">
        <p className="text-gray-500">
          Something went wrong loading your dashboard.
        </p>
      </div>
    );
  }

  const { currentMonth, monthlyTrend, categoryBreakdown, anomalies } =
    dashboardData;

  return (
    <div className="p-4 sm:p-8">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-gray-800">
          Hi {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's how this month is looking
        </p>
      </div>

      {/* ANOMALY ALERTS — shown first, highest priority information */}
      <AnomalyBanner anomalies={anomalies} />

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Spent this month"
          value={Math.round(currentMonth.totalSpent)}
          prefix="₹"
        />
        <StatCard
          label={currentMonth.isOverBudget ? "Over budget by" : "Budget left"}
          value={Math.round(
            currentMonth.isOverBudget
              ? currentMonth.totalSpent - currentMonth.budget
              : currentMonth.remaining,
          )}
          prefix="₹"
          valueColor={
            currentMonth.isOverBudget ? "text-red-500" : "text-[#0D6E6E]"
          }
        />
        <StatCard
          label="Budget used"
          value={currentMonth.percentUsed}
          prefix=""
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-[#F0EDE6] rounded-2xl p-5">
          <h2 className="font-heading text-base font-semibold text-gray-800 mb-4">
            Last 6 months
          </h2>
          <MonthlyTrendChart data={monthlyTrend} />
        </div>

        <div className="bg-white border border-[#F0EDE6] rounded-2xl p-5">
          <h2 className="font-heading text-base font-semibold text-gray-800 mb-4">
            This month by category
          </h2>
          <CategoryPieChart data={categoryBreakdown} />
        </div>
      </div>

      {/* BUDGET PROGRESS */}
      <BudgetProgressBar
        percentUsed={currentMonth.percentUsed}
        isOverBudget={currentMonth.isOverBudget}
        budget={currentMonth.budget}
        totalSpent={currentMonth.totalSpent}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#FBFAF8] p-4 sm:p-8">
      <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#F0EDE6] rounded-2xl p-4 h-20 animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#F0EDE6] rounded-2xl p-5 h-72 animate-pulse"
          />
        ))}
      </div>
      <div className="bg-white border border-[#F0EDE6] rounded-2xl p-5 h-20 animate-pulse" />
    </div>
  );
}

export default Dashboard;
