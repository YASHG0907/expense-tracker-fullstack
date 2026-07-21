// server/tests/anomalyDetector.test.js

const {
  mean,
  standardDeviation,
  calculateZScore,
  buildCategoryMaps,
  detectAnomalies,
} = require("../src/utils/anomalyDetector");

// ─── describe() groups related tests together ──────────────
// ─── test() (or it()) is one individual test case ─────────
// ─── expect() makes the actual assertion ───────────────────

describe("mean()", () => {
  test("calculates the average of a simple array", () => {
    expect(mean([1200, 1100])).toBe(1150);
  });

  test("returns 0 for an empty array", () => {
    // This matters because dividing by array.length when length is 0
    // would produce NaN — our function should guard against that
    expect(mean([])).toBe(0);
  });

  test("handles a single value correctly", () => {
    expect(mean([500])).toBe(500);
  });
});

describe("standardDeviation()", () => {
  test("calculates correct stdDev for known values", () => {
    // Hand-calculated: mean=1150, variance=2500, stdDev=50
    const avg = mean([1200, 1100]);
    expect(standardDeviation([1200, 1100], avg)).toBe(50);
  });

  test("returns 0 when all values are identical", () => {
    // Fixed rent scenario — no variation at all
    const avg = mean([9500, 9500]);
    expect(standardDeviation([9500, 9500], avg)).toBe(0);
  });

  test("returns 0 for an empty array", () => {
    expect(standardDeviation([], 0)).toBe(0);
  });
});

describe("calculateZScore()", () => {
  test("calculates a normal z-score correctly", () => {
    // (3500 - 1150) / 50 = 47
    expect(calculateZScore(3500, 1150, 50)).toBe(47);
  });

  test("returns 0 when current value equals the mean", () => {
    expect(calculateZScore(1150, 1150, 50)).toBe(0);
  });

  test("does not crash when stdDev is 0 — uses fallback instead", () => {
    // avg=9500, stdDev=0 → fallback = max(9500*0.1, 1) = 950
    // zScore = (9600 - 9500) / 950 ≈ 0.105
    const result = calculateZScore(9600, 9500, 0);
    expect(result).toBeCloseTo(0.105, 2);
    expect(Number.isFinite(result)).toBe(true); // never Infinity or NaN
  });

  test("fallback handles a zero mean without crashing", () => {
    // avg=0, stdDev=0 → fallback = max(0, 1) = 1
    const result = calculateZScore(5, 0, 0);
    expect(Number.isFinite(result)).toBe(true);
  });
});

describe("buildCategoryMaps()", () => {
  const sampleRows = [
    { category: "Food", year: 2026, month: 4, total: "1200.00" },
    { category: "Food", year: 2026, month: 5, total: "1100.00" },
    { category: "Food", year: 2026, month: 6, total: "3500.00" },
    { category: "Transport", year: 2026, month: 6, total: "310.00" },
  ];

  test("separates current month from history correctly", () => {
    const { historyByCategory, currentByCategory } = buildCategoryMaps(
      sampleRows,
      6,
      2026,
    );

    expect(historyByCategory.Food).toEqual([1200, 1100]);
    expect(currentByCategory.Food).toBe(3500);
    expect(currentByCategory.Transport).toBe(310);
  });

  test("category with only current-month data has no history entry", () => {
    const { historyByCategory } = buildCategoryMaps(sampleRows, 6, 2026);
    expect(historyByCategory.Transport).toBeUndefined();
  });

  test("returns empty maps when given no rows", () => {
    const { historyByCategory, currentByCategory } = buildCategoryMaps(
      [],
      6,
      2026,
    );
    expect(historyByCategory).toEqual({});
    expect(currentByCategory).toEqual({});
  });
});

describe("detectAnomalies()", () => {
  test("flags a category with a genuine spike", () => {
    const history = { Food: [1200, 1100] };
    const current = { Food: 3500 };

    const anomalies = detectAnomalies(history, current, 2.0);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].category).toBe("Food");
    expect(anomalies[0].severity).toBe("high"); // zScore is 47, well past 3
  });

  test("does NOT flag a category with normal spending", () => {
    const history = { Transport: [300, 320] };
    const current = { Transport: 310 };

    const anomalies = detectAnomalies(history, current, 2.0);

    expect(anomalies).toHaveLength(0);
  });

  test("skips a category with less than 2 months of history", () => {
    const history = { Health: [2000] }; // only 1 month
    const current = { Health: 5000 };

    const anomalies = detectAnomalies(history, current, 2.0);

    expect(anomalies).toHaveLength(0);
  });

  test("skips a category with zero months of history", () => {
    const history = {}; // Health has no history entry at all
    const current = { Health: 2000 };

    const anomalies = detectAnomalies(history, current, 2.0);

    expect(anomalies).toHaveLength(0);
  });

  test("does not flag small fluctuations in a zero-variance category", () => {
    // Fixed rent 9500 twice, then a small bump to 9600 this month
    const history = { Housing: [9500, 9500] };
    const current = { Housing: 9600 };

    const anomalies = detectAnomalies(history, current, 2.0);

    expect(anomalies).toHaveLength(0);
  });

  test("sorts multiple anomalies by severity, worst first", () => {
    const history = {
      Food: [1000, 1000], // mild anomaly
      Shopping: [500, 500], // severe anomaly
    };
    const current = {
      Food: 1300, // small spike
      Shopping: 5000, // huge spike
    };

    const anomalies = detectAnomalies(history, current, 1.0);

    expect(anomalies[0].category).toBe("Shopping"); // worse one comes first
    expect(anomalies[0].zScore).toBeGreaterThan(anomalies[1].zScore);
  });

  test("returns an empty array when nothing exceeds the threshold", () => {
    const history = { Food: [1000, 1050] };
    const current = { Food: 1060 };

    const anomalies = detectAnomalies(history, current, 2.0);

    expect(anomalies).toEqual([]);
  });
});
