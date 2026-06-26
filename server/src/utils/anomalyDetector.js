// src/utils/anomalyDetector.js
//
// Pure statistical functions — no database, no Express, no async code.
// This makes them trivially easy to unit test later.

// ─── MEAN ──────────────────────────────────────────────────
// Simple average of an array of numbers

const mean = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((total, n) => total + n, 0);
  return sum / numbers.length;
};

// ─── STANDARD DEVIATION ────────────────────────────────────
// Measures how spread out the numbers are from their mean
// Formula: sqrt( average of (each value - mean)^2 )

const standardDeviation = (numbers, avg) => {
  if (numbers.length === 0) return 0;

  // For each number, find the squared difference from the mean
  const squaredDiffs = numbers.map((n) => Math.pow(n - avg, 2));

  // Average those squared differences = variance
  const variance = mean(squaredDiffs);

  // Square root of variance = standard deviation
  return Math.sqrt(variance);
};

// ─── Z-SCORE ────────────────────────────────────────────────
// How many standard deviations is "value" away from "avg"?

const calculateZScore = (value, avg, stdDev) => {
  // EDGE CASE: if stdDev is 0, it means historical spending
  // was IDENTICAL every month (e.g., fixed rent: 9500, 9500, 9500)
  // Dividing by 0 would crash. Instead, we use a fallback —
  // treat 10% of the mean as the "normal variation" floor.
  // This prevents tiny fluctuations (9500 → 9600) from
  // being flagged as huge anomalies.
  const safeStdDev = stdDev > 0 ? stdDev : Math.max(avg * 0.1, 1);

  return (value - avg) / safeStdDev;
};

// ─── BUILD CATEGORY MAPS FROM RAW DB ROWS ──────────────────
// Takes raw rows like:
//   [{ category: 'Food', year: 2025, month: 1, total: 1200 }, ...]
// Splits them into:
//   historyByCategory = { Food: [1200, 1100], Transport: [300, 320] }
//   currentByCategory = { Food: 3500, Transport: 310 }

const buildCategoryMaps = (rows, currentMonth, currentYear) => {
  const historyByCategory = {};
  const currentByCategory = {};

  for (const row of rows) {
    const total = parseFloat(row.total);
    const isCurrentMonth =
      row.month === currentMonth && row.year === currentYear;

    if (isCurrentMonth) {
      currentByCategory[row.category] = total;
    } else {
      // If this category doesn't exist in history yet, create an empty array
      if (!historyByCategory[row.category]) {
        historyByCategory[row.category] = [];
      }
      historyByCategory[row.category].push(total);
    }
  }

  return { historyByCategory, currentByCategory };
};

// ─── MAIN DETECTION FUNCTION ────────────────────────────────
// This is what the controller calls

const detectAnomalies = (
  historyByCategory,
  currentByCategory,
  threshold = 2.0,
) => {
  const alerts = [];

  // Loop through every category that has spending THIS month
  for (const category in currentByCategory) {
    const history = historyByCategory[category] || [];
    const currentValue = currentByCategory[category];

    // RULE: need at least 2 months of history to calculate
    // meaningful statistics. With 0 or 1 data points, stdDev
    // is meaningless — skip this category entirely.
    if (history.length < 2) {
      continue;
    }

    const avg = mean(history);
    const stdDev = standardDeviation(history, avg);
    const zScore = calculateZScore(currentValue, avg, stdDev);

    // Only flag if zScore exceeds our threshold
    if (zScore > threshold) {
      const percentageIncrease =
        avg > 0 ? Math.round(((currentValue - avg) / avg) * 100) : 0;

      alerts.push({
        category,
        currentSpend: Math.round(currentValue * 100) / 100,
        historicalAverage: Math.round(avg * 100) / 100,
        zScore: Math.round(zScore * 100) / 100,
        percentageIncrease,
        // Severity helps the frontend decide alert color (red vs orange)
        severity: zScore > 3 ? "high" : "medium",
      });
    }
  }

  // Show the worst anomaly first
  return alerts.sort((a, b) => b.zScore - a.zScore);
};

module.exports = {
  mean,
  standardDeviation,
  calculateZScore,
  buildCategoryMaps,
  detectAnomalies,
};
