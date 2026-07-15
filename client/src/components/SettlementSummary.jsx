// client/src/components/SettlementSummary.jsx

import { ArrowRight } from "lucide-react";

// Renders the simplified settlement list from your Day 6 debt-simplification
// algorithm. Each item is one transaction: "X pays Y ₹amount"

function SettlementSummary({ settlements, currentUserId }) {
  if (!settlements || settlements.length === 0) {
    return (
      <div className="bg-[#FBFAF8] border border-[#F0EDE6] rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500">Everyone's settled up 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {settlements.map((s, idx) => {
        const involvesMe =
          s.fromUserId === currentUserId || s.toUserId === currentUserId;

        return (
          <div
            key={idx}
            className={`flex items-center justify-between rounded-xl p-3.5 border ${
              involvesMe
                ? "bg-[#FFF4EE] border-[#FFDCC9]"
                : "bg-[#FBFAF8] border-[#F0EDE6]"
            }`}
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-800">
                {s.fromUserId === currentUserId ? "You" : s.from}
              </span>
              <ArrowRight size={14} className="text-gray-400" />
              <span className="font-medium text-gray-800">
                {s.toUserId === currentUserId ? "You" : s.to}
              </span>
            </div>
            <span className="font-heading font-semibold text-gray-800">
              ₹{s.amount.toLocaleString("en-IN")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default SettlementSummary;
