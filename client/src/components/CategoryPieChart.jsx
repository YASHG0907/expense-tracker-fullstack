// client/src/components/CategoryPieChart.jsx

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Consistent category colors — same palette used in the Expenses page (Day 10)
// so a category is visually the same color everywhere in the app
const CATEGORY_COLORS = {
  Food: "#FF6B4A",
  Transport: "#0D6E6E",
  Shopping: "#A855F7",
  Health: "#22C55E",
  Entertainment: "#EAB308",
  Housing: "#3B82F6",
  Utilities: "#F97316",
  Education: "#EC4899",
  Travel: "#14B8A6",
  Other: "#6B7280",
};

function CategoryPieChart({ data }) {
  const chartData = data.map((item) => ({
    name: item.category,
    value: Math.round(parseFloat(item.total)),
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const percent =
      total > 0 ? Math.round((payload[0].value / total) * 100) : 0;

    return (
      <div className="bg-white border border-[#F0EDE6] rounded-lg px-3 py-2 shadow-sm">
        <p className="text-xs text-gray-500">{payload[0].name}</p>
        <p className="text-sm font-semibold text-gray-800">
          ₹{payload[0].value.toLocaleString("en-IN")} · {percent}%
        </p>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center">
        <p className="text-sm text-gray-400">
          No spending recorded this month yet
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={CATEGORY_COLORS[entry.name] || "#6B7280"}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span className="text-xs text-gray-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default CategoryPieChart;
