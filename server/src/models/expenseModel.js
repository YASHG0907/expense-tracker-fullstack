// src/models/expenseModel.js

const pool = require("../config/db");

// ─── GET ALL EXPENSES FOR A USER ──────────────────────────
// Supports optional filters: month, year, category
// This is what powers the expenses list page

const getExpensesByUser = async (userId, filters = {}) => {
  // Start with the base query
  let query = `
    SELECT 
      id,
      title,
      amount,
      category,
      expense_date,
      note,
      created_at
    FROM expenses
    WHERE user_id = ?
  `;

  // values array holds all the ? placeholder values
  // ORDER MATTERS — values must match ? positions exactly
  const values = [userId];

  // Dynamically add filters only if provided
  // This is called "dynamic query building"
  if (filters.month && filters.year) {
    query += ` AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?`;
    values.push(filters.month, filters.year);
  }

  if (filters.category) {
    query += ` AND category = ?`;
    values.push(filters.category);
  }

  // Always sort newest first
  query += ` ORDER BY expense_date DESC, created_at DESC`;

  // Optional pagination
  if (filters.limit) {
    query += ` LIMIT ?`;
    values.push(parseInt(filters.limit));
  }

  const [rows] = await pool.query(query, values);
  return rows;
};

// ─── GET A SINGLE EXPENSE BY ID ───────────────────────────
// Used before update/delete to check ownership

const getExpenseById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM expenses WHERE id = ?", [id]);
  return rows[0]; // undefined if not found
};

// ─── CREATE A NEW EXPENSE ─────────────────────────────────

const createExpense = async (userId, data) => {
  const { title, amount, category, expense_date, note } = data;

  const [result] = await pool.query(
    `INSERT INTO expenses 
      (user_id, title, amount, category, expense_date, note) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, title, amount, category, expense_date, note || null],
  );

  // Return the full new expense by fetching it
  return getExpenseById(result.insertId);
};

// ─── UPDATE AN EXPENSE ────────────────────────────────────
// Only updates fields that were actually sent
// If user only sends {amount: 500}, only amount changes

const updateExpense = async (id, data) => {
  const { title, amount, category, expense_date, note } = data;

  await pool.query(
    `UPDATE expenses 
     SET 
       title        = COALESCE(?, title),
       amount       = COALESCE(?, amount),
       category     = COALESCE(?, category),
       expense_date = COALESCE(?, expense_date),
       note         = COALESCE(?, note)
     WHERE id = ?`,
    [title, amount, category, expense_date, note, id],
    // COALESCE(?, column) means:
    // if ? is null → keep the old value
    // if ? has a value → use the new value
  );

  return getExpenseById(id);
};

// ─── DELETE AN EXPENSE ────────────────────────────────────

const deleteExpense = async (id) => {
  const [result] = await pool.query("DELETE FROM expenses WHERE id = ?", [id]);
  // affectedRows tells you if the delete actually worked
  return result.affectedRows > 0;
};

// ─── MONTHLY SUMMARY FOR DASHBOARD ───────────────────────
// Returns total spent per month for the last 6 months
// This powers the bar chart on the dashboard

const getMonthlySummary = async (userId) => {
  const [rows] = await pool.query(
    `SELECT 
       YEAR(expense_date)  AS year,
       MONTH(expense_date) AS month,
       SUM(amount)         AS total,
       COUNT(*)            AS count
     FROM expenses
     WHERE 
       user_id = ?
       AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY 
       YEAR(expense_date), 
       MONTH(expense_date)
     ORDER BY 
       year ASC, month ASC`,
    [userId],
  );
  return rows;
};

// ─── CATEGORY TOTALS FOR CURRENT MONTH ───────────────────
// Returns spend per category this month
// This powers the pie chart on the dashboard

const getCategoryTotals = async (userId, month, year) => {
  const [rows] = await pool.query(
    `SELECT 
       category,
       SUM(amount)  AS total,
       COUNT(*)     AS count
     FROM expenses
     WHERE 
       user_id = ?
       AND MONTH(expense_date) = ?
       AND YEAR(expense_date)  = ?
     GROUP BY category
     ORDER BY total DESC`,
    [userId, month, year],
  );
  return rows;
};

// ─── TOTAL SPENT THIS MONTH ───────────────────────────────
// Used to check if user exceeded their monthly budget

const getMonthlyTotal = async (userId, month, year) => {
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE 
       user_id = ?
       AND MONTH(expense_date) = ?
       AND YEAR(expense_date)  = ?`,
    [userId, month, year],
  );
  return parseFloat(rows[0].total);
};

module.exports = {
  getExpensesByUser,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getMonthlySummary,
  getCategoryTotals,
  getMonthlyTotal,
};
