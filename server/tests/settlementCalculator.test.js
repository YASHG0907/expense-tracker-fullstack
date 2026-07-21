// server/tests/settlementCalculator.test.js

const {
  calculateBalances,
  simplifySettlements,
} = require("../src/utils/settlementCalculator");

describe("calculateBalances()", () => {
  const members = [
    { userId: 1, name: "Rahul", sharePercentage: 33.33 },
    { userId: 2, name: "Priya", sharePercentage: 33.33 },
    { userId: 3, name: "Aman", sharePercentage: 33.34 },
  ];

  test("calculates correct net balances for the Goa trip example", () => {
    const expenses = [
      { paidBy: 1, amount: 3000 },
      { paidBy: 2, amount: 1500 },
      { paidBy: 3, amount: 300 },
    ];

    const balances = calculateBalances(members, expenses);

    const rahul = balances.find((b) => b.userId === 1);
    const priya = balances.find((b) => b.userId === 2);
    const aman = balances.find((b) => b.userId === 3);

    expect(rahul.paid).toBe(3000);
    expect(rahul.net).toBeCloseTo(1400, 0); // owed ~1600, paid 3000
    expect(priya.net).toBeCloseTo(-100, 0);
    expect(aman.net).toBeCloseTo(-1300, 0);
  });

  test("every member has a net of 0 when nobody paid anything", () => {
    const expenses = [];
    const balances = calculateBalances(members, expenses);

    balances.forEach((b) => {
      expect(b.paid).toBe(0);
      expect(b.owed).toBe(0);
      expect(b.net).toBe(0);
    });
  });

  test("all balances sum to approximately zero", () => {
    // This is a mathematical invariant — money can't appear or disappear.
    // Whatever one person is owed, the group collectively owes them.
    const expenses = [
      { paidBy: 1, amount: 3000 },
      { paidBy: 2, amount: 1500 },
      { paidBy: 3, amount: 300 },
    ];

    const balances = calculateBalances(members, expenses);
    const totalNet = balances.reduce((sum, b) => sum + b.net, 0);

    expect(totalNet).toBeCloseTo(0, 1);
  });

  test("a single member paying for everything reflects correctly", () => {
    const twoMembers = [
      { userId: 1, name: "Rahul", sharePercentage: 50 },
      { userId: 2, name: "Priya", sharePercentage: 50 },
    ];
    const expenses = [{ paidBy: 1, amount: 1000 }];

    const balances = calculateBalances(twoMembers, expenses);
    const rahul = balances.find((b) => b.userId === 1);
    const priya = balances.find((b) => b.userId === 2);

    expect(rahul.net).toBe(500); // paid 1000, owed 500 → net +500
    expect(priya.net).toBe(-500); // paid 0, owed 500 → net -500
  });
});

describe("simplifySettlements()", () => {
  test("produces the correct minimal settlements for the Goa trip", () => {
    const balances = [
      { userId: 1, name: "Rahul", net: 1400 },
      { userId: 2, name: "Priya", net: -100 },
      { userId: 3, name: "Aman", net: -1300 },
    ];

    const settlements = simplifySettlements(balances);

    expect(settlements).toHaveLength(2); // proven minimal — never more than n-1

    const amanPayment = settlements.find((s) => s.fromUserId === 3);
    const priyaPayment = settlements.find((s) => s.fromUserId === 2);

    expect(amanPayment.toUserId).toBe(1);
    expect(amanPayment.amount).toBe(1300);
    expect(priyaPayment.toUserId).toBe(1);
    expect(priyaPayment.amount).toBe(100);
  });

  test("returns an empty array when everyone is already settled", () => {
    const balances = [
      { userId: 1, name: "Rahul", net: 0 },
      { userId: 2, name: "Priya", net: 0 },
    ];

    expect(simplifySettlements(balances)).toEqual([]);
  });

  test("handles a simple two-person debt", () => {
    const balances = [
      { userId: 1, name: "Rahul", net: 500 },
      { userId: 2, name: "Priya", net: -500 },
    ];

    const settlements = simplifySettlements(balances);

    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toMatchObject({
      fromUserId: 2,
      toUserId: 1,
      amount: 500,
    });
  });

  test("ignores balances within floating-point rounding tolerance of zero", () => {
    // 0.005 is intentionally below the 0.01 threshold in the algorithm —
    // this simulates leftover floating-point dust that shouldn't
    // generate a nonsensical "pay me half a paisa" transaction
    const balances = [
      { userId: 1, name: "Rahul", net: 0.005 },
      { userId: 2, name: "Priya", net: -0.005 },
    ];

    expect(simplifySettlements(balances)).toEqual([]);
  });

  test("never produces more than n-1 transactions for n people", () => {
    // 5 people, deliberately uneven balances
    const balances = [
      { userId: 1, name: "A", net: 800 },
      { userId: 2, name: "B", net: 400 },
      { userId: 3, name: "C", net: -200 },
      { userId: 4, name: "D", net: -500 },
      { userId: 5, name: "E", net: -500 },
    ];

    const settlements = simplifySettlements(balances);

    expect(settlements.length).toBeLessThanOrEqual(balances.length - 1);
  });
});
