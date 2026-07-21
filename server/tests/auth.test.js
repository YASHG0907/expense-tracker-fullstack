// server/tests/auth.test.js

const request = require("supertest");
const app = require("../src/index");
const {
  generateTestEmail,
  cleanupTestUsers,
  closeDbConnection,
} = require("./testHelpers");

// afterAll runs once, after every test in this file has finished
afterAll(async () => {
  await cleanupTestUsers();
  await closeDbConnection();
});

describe("POST /api/auth/register", () => {
  test("creates a new user and returns a token", async () => {
    const email = generateTestEmail();

    const response = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email,
      password: "password123",
      monthly_budget: 15000,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(email);
    // Password hash should NEVER be sent back to the client
    expect(response.body.user.password_hash).toBeUndefined();
  });

  test("rejects registration with a duplicate email", async () => {
    const email = generateTestEmail();

    // Register once — should succeed
    await request(app).post("/api/auth/register").send({
      name: "First User",
      email,
      password: "password123",
    });

    // Register again with the SAME email — should fail
    const response = await request(app).post("/api/auth/register").send({
      name: "Second User",
      email,
      password: "differentpassword",
    });

    expect(response.status).toBe(409); // Conflict
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/already exists/i);
  });

  test("rejects registration with an invalid email format", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "not-a-valid-email",
      password: "password123",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects registration with a password under 6 characters", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: generateTestEmail(),
      password: "123", // too short
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/6 characters/i);
  });

  test("rejects registration with a missing name", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: generateTestEmail(),
      password: "password123",
      // name is missing entirely
    });

    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  // Reused across multiple tests in this describe block — register ONE
  // user before any of these run, since login tests need an existing account
  let testEmail;
  const testPassword = "password123";

  beforeAll(async () => {
    testEmail = generateTestEmail();
    await request(app).post("/api/auth/register").send({
      name: "Login Test User",
      email: testEmail,
      password: testPassword,
    });
  });

  test("logs in successfully with correct credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(testEmail);
  });

  test("rejects login with wrong password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  test("rejects login with an email that does not exist", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "doesnotexist_" + Date.now() + "@example.com",
        password: "anypassword",
      });

    expect(response.status).toBe(401);
    // CRITICAL: this must be the EXACT SAME message as wrong password,
    // to prevent user enumeration — confirmed on Day 3
    expect(response.body.message).toBe("Invalid email or password");
  });
});

describe("GET /api/auth/me", () => {
  let token;
  let testEmail;

  beforeAll(async () => {
    testEmail = generateTestEmail();
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Me Route Test User",
        email: testEmail,
        password: "password123",
      });
    token = registerResponse.body.token;
  });

  test("returns user details with a valid token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(testEmail);
  });

  test("rejects the request with no token at all", async () => {
    const response = await request(app).get("/api/auth/me");
    // no .set('Authorization', ...) at all

    expect(response.status).toBe(401);
  });

  test("rejects the request with an invalid/garbage token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer this.is.not.a.real.token");

    expect(response.status).toBe(401);
  });
});
