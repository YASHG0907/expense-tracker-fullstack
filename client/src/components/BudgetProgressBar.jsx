// client/src/components/BudgetProgressBar.jsx

import { useEffect, useState } from "react";

// Animated progress bar showing % of monthly budget used.
// Color shifts based on how close to (or over) the budget the user is.

function BudgetProgressBar({ percentUsed, isOverBudget, budget, totalSpent }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  // Animate the bar filling in on mount, rather than snapping instantly —
  // matches the count-up feel used elsewhere (StatCard from Day 8)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(Math.min(percentUsed, 100));
    }, 100);
    return () => clearTimeout(timer);
  }, [percentUsed]);

  // No budget set at all — show a neutral empty state instead of a
  // misleading 0% bar that implies a budget exists when it doesn't
  if (!budget || budget === 0) {
    return (
      <div className="bg-white border border-[#F0EDE6] rounded-2xl p-5">
        <p className="text-sm text-gray-500">
          No monthly budget set yet. Add one in your account settings to track
          progress here.
        </p>
      </div>
    );
  }

  const barColor = isOverBudget
    ? "bg-red-500"
    : percentUsed >= 80
      ? "bg-amber-400"
      : "bg-[#0D6E6E]";

  return (
    <div className="bg-white border border-[#F0EDE6] rounded-2xl p-5">
      <div className="flex justify-between items-baseline mb-2">
        <p className="text-sm font-medium text-gray-700">Monthly budget</p>
        <p className="text-xs text-gray-500">
          ₹{Math.round(totalSpent).toLocaleString("en-IN")} of ₹
          {Math.round(budget).toLocaleString("en-IN")}
        </p>
      </div>

      <div className="h-3 bg-[#F0EDE6] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>

      <p
        className={`text-xs mt-2 ${isOverBudget ? "text-red-500 font-medium" : "text-gray-500"}`}
      >
        {isOverBudget
          ? `You're ${percentUsed - 100}% over budget this month`
          : `${percentUsed}% used — you're on track`}
      </p>
    </div>
  );
}

export default BudgetProgressBar;
