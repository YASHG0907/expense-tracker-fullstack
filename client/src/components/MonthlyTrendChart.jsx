// client/src/components/MonthlyTrendChart.jsx

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Recharts needs a flat array of objects with consistent keys.
// Our backend gives us { month: 3, year: 2026, total: "14350.00" }
// We reshape it into { name: "Mar", total: 14350 } for the chart to consume.

function MonthlyTrendChart({ data }) {
  const chartData = data.map((item) => ({
    name: MONTH_NAMES[item.month - 1], // backend months are 1-indexed
    total: Math.round(parseFloat(item.total)),
  }));

  // Custom tooltip — the default Recharts tooltip doesn't match our theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-[#F0EDE6] rounded-lg px-3 py-2 shadow-sm">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800">
          ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#F0EDE6"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#6B7280" }}
          axisLine={{ stroke: "#F0EDE6" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `₹${value / 1000}k`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#FBFAF8" }} />
        <Bar dataKey="total" fill="#FF6B4A" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default MonthlyTrendChart;
