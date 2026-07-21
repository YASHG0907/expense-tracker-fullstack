// server/tests/expenses.test.js

const request = require("supertest");
const app = require("../src/index");
const {
  generateTestEmail,
  cleanupTestUsers,
  closeDbConnection,
} = require("./testHelpers");

afterAll(async () => {
  await cleanupTestUsers();
  await closeDbConnection();
});

describe("Expense CRUD with ownership protection", () => {
  // Two separate users — User A creates an expense, User B tries to
  // tamper with it. This is exactly how you'd test this manually in
  // Thunder Client on Day 4, just automated now.

  let userAToken, userBToken;
  let userAId, userBId;
  let createdExpenseId;

  beforeAll(async () => {
    const userA = await request(app).post("/api/auth/register").send({
      name: "User A",
      email: generateTestEmail(),
      password: "password123",
    });
    userAToken = userA.body.token;
    userAId = userA.body.user.id;

    const userB = await request(app).post("/api/auth/register").send({
      name: "User B",
      email: generateTestEmail(),
      password: "password123",
    });
    userBToken = userB.body.token;
    userBId = userB.body.user.id;
  });

  test("User A can create an expense", async () => {
    const response = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Grocery run",
        amount: 1500,
        category: "Food",
        expense_date: "2026-07-01",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe("Grocery run");

    // Save this ID — the rest of the tests in this block operate on it
    createdExpenseId = response.body.data.id;
  });

  test("User A can see their own expense in the list", async () => {
    const response = await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.status).toBe(200);
    const found = response.body.data.find((e) => e.id === createdExpenseId);
    expect(found).toBeDefined();
  });

  test("User B does NOT see User A's expense in their own list", async () => {
    const response = await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${userBToken}`);

    expect(response.status).toBe(200);
    const found = response.body.data.find((e) => e.id === createdExpenseId);
    expect(found).toBeUndefined(); // must NOT appear in User B's list
  });

  test("User B CANNOT update User A's expense — returns 403", async () => {
    const response = await request(app)
      .put(`/api/expenses/${createdExpenseId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ amount: 99999 });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/permission/i);
  });

  test("User B CANNOT delete User A's expense — returns 403", async () => {
    const response = await request(app)
      .delete(`/api/expenses/${createdExpenseId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(response.status).toBe(403);
  });

  test("the expense was NOT actually modified by User B's failed attempt", async () => {
    // Confirm User B's blocked update didn't silently succeed anyway —
    // check the actual current state as User A
    const response = await request(app)
      .get(`/api/expenses/${createdExpenseId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.body.data.amount).not.toBe("99999.00");
  });

  test("User A CAN update their own expense", async () => {
    const response = await request(app)
      .put(`/api/expenses/${createdExpenseId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ amount: 1800 });

    expect(response.status).toBe(200);
    expect(response.body.data.amount).toBe("1800.00");
  });

  test("User A CAN delete their own expense", async () => {
    const response = await request(app)
      .delete(`/api/expenses/${createdExpenseId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.status).toBe(200);
  });

  test("the deleted expense no longer appears in User A's list", async () => {
    const response = await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${userAToken}`);

    const found = response.body.data.find((e) => e.id === createdExpenseId);
    expect(found).toBeUndefined();
  });
});

describe("Expense validation", () => {
  let token;

  beforeAll(async () => {
    const user = await request(app).post("/api/auth/register").send({
      name: "Validation Test User",
      email: generateTestEmail(),
      password: "password123",
    });
    token = user.body.token;
  });

  test("rejects an expense with a negative amount", async () => {
    const response = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Bad expense",
        amount: -500,
        category: "Food",
        expense_date: "2026-07-01",
      });

    expect(response.status).toBe(400);
  });

  test("rejects an expense with an invalid category", async () => {
    const response = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Bad expense",
        amount: 500,
        category: "NotARealCategory",
        expense_date: "2026-07-01",
      });

    expect(response.status).toBe(400);
  });

  test("rejects an expense dated in the future", async () => {
    const response = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Future expense",
        amount: 500,
        category: "Food",
        expense_date: "2099-01-01",
      });

    expect(response.status).toBe(400);
  });

  test("rejects an unauthenticated request entirely", async () => {
    const response = await request(app).post("/api/expenses").send({
      title: "No auth",
      amount: 500,
      category: "Food",
      expense_date: "2026-07-01",
    });

    expect(response.status).toBe(401);
  });
});
