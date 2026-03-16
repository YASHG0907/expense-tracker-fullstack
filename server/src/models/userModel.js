// src/models/userModel.js

const pool = require("../config/db");

// Find a user by their email address
// Returns the full user row including password_hash
// Used during login to verify password
const findByEmail = async (email) => {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE email = ?",
    [email], // The ? is a placeholder — prevents SQL injection
  );
  // rows is always an array, even if 0 results
  // rows[0] is the first result, or undefined if not found
  return rows[0];
};

// Find a user by their ID
// Used after JWT verification to get user details
// Does NOT return password_hash — never send that to frontend
const findById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, monthly_budget, created_at FROM users WHERE id = ?",
    [id],
  );
  return rows[0];
};

// Create a new user in the database
// password here is already hashed — never store plain passwords
const createUser = async (name, email, hashedPassword, monthly_budget = 0) => {
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password_hash, monthly_budget) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, monthly_budget],
  );
  // result.insertId gives you the auto-generated ID of the new row
  return result.insertId;
};

module.exports = { findByEmail, findById, createUser };
