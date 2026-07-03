// src/controllers/analyticsController.js
//
// This controller doesn't introduce new database queries.
// It composes existing model functions into dashboard-shaped responses.

const {
  getMonthlySummary,
  getCategoryTotals,
  getMonthlyTotal,
  getCategoryHistoryForAnomaly,
} = require("../models/expenseModel");

const { getUserGroups } = require("../models/groupModel");
const { findById } = require("../models/userModel");
const {
  detectAnomalies,
  buildCategoryMaps,
} = require("../utils/anomalyDetector");
const AppError = require("../utils/AppError");

// ─── FULL DASHBOARD PAYLOAD ─────────────────────────────────
// GET /api/analytics/dashboard
//
// Single call the frontend makes when the Dashboard page loads.
// Combines: monthly trend, category breakdown, budget status,
// anomalies, and group count — everything in one response.
// Reduces frontend to 1 network request instead of 4 separate ones.

const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Run everything in parallel — these queries don't depend on each other
    const [
      monthlyTrend,
      categoryBreakdown,
      monthlyTotal,
      user,
      anomalyRows,
      groups,
    ] = await Promise.all([
      getMonthlySummary(req.userId),
      getCategoryTotals(req.userId, currentMonth, currentYear),
      getMonthlyTotal(req.userId, currentMonth, currentYear),
      findById(req.userId),
      getCategoryHistoryForAnomaly(req.userId, 4),
      getUserGroups(req.userId),
    ]);

    // Anomaly detection reuses the exact same pure functions from Day 5
    const { historyByCategory, currentByCategory } = buildCategoryMaps(
      anomalyRows,
      currentMonth,
      currentYear,
    );
    const anomalies = detectAnomalies(
      historyByCategory,
      currentByCategory,
      2.0,
    );

    const budget = parseFloat(user.monthly_budget) || 0;
    const spent = parseFloat(monthlyTotal) || 0;

    res.status(200).json({
      success: true,
      data: {
        currentMonth: {
          month: currentMonth,
          year: currentYear,
          totalSpent: Math.round(spent * 100) / 100,
          budget,
          remaining: Math.round(Math.max(0, budget - spent) * 100) / 100,
          percentUsed: budget > 0 ? Math.round((spent / budget) * 100) : 0,
          isOverBudget: budget > 0 && spent > budget,
        },
        monthlyTrend, // for the bar chart — last 6 months
        categoryBreakdown, // for the pie chart — this month by category
        anomalies, // alert banners
        groupsCount: groups.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── TRENDS ONLY (lighter call, just the bar chart data) ────
// GET /api/analytics/trends

const getTrends = async (req, res, next) => {
  try {
    const monthlyTrend = await getMonthlySummary(req.userId);

    // Fill in missing months with zero so the bar chart
    // doesn't have gaps — e.g. if user had no expenses in February
    const filled = fillMissingMonths(monthlyTrend);

    res.status(200).json({ success: true, data: filled });
  } catch (err) {
    next(err);
  }
};

// ─── HELPER: fill gaps in monthly data ──────────────────────
// If a user has expenses in Jan and Mar but not Feb,
// the raw SQL result skips Feb entirely. A bar chart with
// a missing bar looks like a bug. This fills it with total: 0

const fillMissingMonths = (rows) => {
  const now = new Date();
  const result = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    const existing = rows.find((r) => r.month === month && r.year === year);

    result.push({
      month,
      year,
      total: existing ? parseFloat(existing.total) : 0,
      count: existing ? existing.count : 0,
    });
  }

  return result;
};

module.exports = { getDashboard, getTrends };
