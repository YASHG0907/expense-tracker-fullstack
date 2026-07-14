// client/src/components/AnomalyBanner.jsx

import { AlertTriangle } from "lucide-react";

// Renders one banner per anomaly detected.
// Each anomaly object comes from the Z-score algorithm built on Day 5:
// { category, currentSpend, historicalAverage, zScore, percentageIncrease, severity }

function AnomalyBanner({ anomalies }) {
  if (!anomalies || anomalies.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {anomalies.map((anomaly) => (
        <div
          key={anomaly.category}
          className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
            anomaly.severity === "high"
              ? "bg-red-50 border-red-200"
              : "bg-orange-50 border-orange-200"
          }`}
        >
          <AlertTriangle
            size={18}
            className={`flex-shrink-0 mt-0.5 ${
              anomaly.severity === "high" ? "text-red-500" : "text-orange-500"
            }`}
          />
          <div>
            <p
              className={`text-sm font-medium ${
                anomaly.severity === "high" ? "text-red-700" : "text-orange-700"
              }`}
            >
              {anomaly.category} spending looks unusual
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              ₹{anomaly.currentSpend.toLocaleString("en-IN")} this month vs your
              usual ₹{anomaly.historicalAverage.toLocaleString("en-IN")} (
              {anomaly.percentageIncrease > 0 ? "+" : ""}
              {anomaly.percentageIncrease}%)
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AnomalyBanner;
