// src/routes/expenses.js

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  getAllExpenses,
  getSingleExpense,
  addExpense,
  editExpense,
  removeExpense,
  getSummary,
  exportCSV,
} = require("../controllers/expenseController");

// Apply protect middleware to ALL routes in this file
// router.use() applies to every route below it
// Now you don't have to write protect on every single route
router.use(protect);

// Summary and export MUST come before /:id routes
// Why? Because if they came after, Express would think
// "summary" and "export" are expense IDs
// /api/expenses/summary → if /:id is first, req.params.id = "summary"
router.get("/summary", getSummary);
router.get("/export", exportCSV);

// Standard CRUD routes
router.get("/", getAllExpenses);
router.post("/", addExpense);
router.get("/:id", getSingleExpense);
router.put("/:id", editExpense);
router.delete("/:id", removeExpense);

module.exports = router;
