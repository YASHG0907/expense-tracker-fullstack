// server/tests/testHelpers.js
//
// Shared utilities for integration tests — creating throwaway test users
// and cleaning up after ourselves so tests don't pollute the real database
// or fail on a second run due to leftover data from the first run.

const pool = require("../src/config/db");

// Every test-created user gets an email with this prefix, so cleanup
// can safely target ONLY test data without touching real accounts
const TEST_EMAIL_PREFIX = "jesttest_";

const generateTestEmail = () => {
  // Date.now() ensures uniqueness across test runs within the same file
  return `${TEST_EMAIL_PREFIX}${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
};

// Deletes all test users (and their expenses, via ON DELETE CASCADE
// from your Day 2 schema) created during this test run.
// Called in an afterAll() block so it runs once after all tests in a file finish.

const cleanupTestUsers = async () => {
  await pool.query("DELETE FROM users WHERE email LIKE ?", [
    `${TEST_EMAIL_PREFIX}%`,
  ]);
};

// Closes the MySQL connection pool so Jest can exit cleanly.
// Without this, Jest hangs after tests finish because the pool
// keeps an open connection alive in the background.

const closeDbConnection = async () => {
  await pool.end();
};

module.exports = {
  generateTestEmail,
  cleanupTestUsers,
  closeDbConnection,
};
