// src/controllers/expenseController.js

const {
  getExpensesByUser,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getMonthlySummary,
  getCategoryTotals,
  getMonthlyTotal,
} = require("../models/expenseModel");

const { findById } = require("../models/userModel");
const {
  createExpenseSchema,
  updateExpenseSchema,
} = require("../utils/validators");
const AppError = require("../utils/AppError");

// ─── GET ALL EXPENSES ─────────────────────────────────────
// GET /api/expenses
// Optional query params: ?month=3&year=2025&category=Food&limit=20
//
// How query params work:
// URL: /api/expenses?month=3&year=2025
// In code: req.query.month = "3", req.query.year = "2025"

const getAllExpenses = async (req, res, next) => {
  try {
    const filters = {
      month: req.query.month,
      year: req.query.year,
      category: req.query.category,
      limit: req.query.limit,
    };

    // req.userId comes from the auth middleware
    const expenses = await getExpensesByUser(req.userId, filters);

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE EXPENSE ───────────────────────────────────
// GET /api/expenses/:id
// :id is a URL parameter — /api/expenses/5 means req.params.id = "5"

const getSingleExpense = async (req, res, next) => {
  try {
    const expense = await getExpenseById(req.params.id);

    // Check 1: does it exist?
    if (!expense) {
      return next(new AppError("Expense not found", 404));
    }

    // Check 2: does it belong to the logged-in user?
    // This is the OWNERSHIP CHECK — critical security
    // Without this, user A could view user B's expenses
    if (expense.user_id !== req.userId) {
      return next(
        new AppError("You do not have permission to view this expense", 403),
      );
      // 403 = Forbidden (you're logged in, but not allowed)
    }

    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE EXPENSE ───────────────────────────────────────
// POST /api/expenses

const addExpense = async (req, res, next) => {
  try {
    // STEP 1: Validate the request body
    const { error, value } = createExpenseSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return next(new AppError(messages, 400));
    }

    // STEP 2: Create the expense
    const newExpense = await createExpense(req.userId, value);

    // STEP 3: Check if user exceeded their monthly budget
    // Get the month and year from the expense date
    const expenseDate = new Date(value.expense_date);
    const month = expenseDate.getMonth() + 1; // getMonth() is 0-indexed
    const year = expenseDate.getFullYear();

    const monthlyTotal = await getMonthlyTotal(req.userId, month, year);
    const user = await findById(req.userId);

    // Only warn if user has set a budget
    let budgetWarning = null;
    if (user.monthly_budget > 0 && monthlyTotal > user.monthly_budget) {
      budgetWarning = {
        exceeded: true,
        budget: user.monthly_budget,
        spent: monthlyTotal,
        overage: (monthlyTotal - user.monthly_budget).toFixed(2),
      };
    }

    res.status(201).json({
      success: true,
      message: "Expense added successfully",
      data: newExpense,
      budgetWarning, // null if not exceeded, object if exceeded
    });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE EXPENSE ───────────────────────────────────────
// PUT /api/expenses/:id

const editExpense = async (req, res, next) => {
  try {
    const expense = await getExpenseById(req.params.id);

    if (!expense) {
      return next(new AppError("Expense not found", 404));
    }

    // ADD THESE 4 LINES
    console.log("expense.user_id        →", expense.user_id);
    console.log("typeof expense.user_id →", typeof expense.user_id);
    console.log("req.userId             →", req.userId);
    console.log("typeof req.userId      →", typeof req.userId);

    if (expense.user_id !== req.userId) {
      return next(
        new AppError("You do not have permission to edit this expense", 403),
      );
    }

    // STEP 4: Update
    const updatedExpense = await updateExpense(req.params.id, value);

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE EXPENSE ───────────────────────────────────────
// DELETE /api/expenses/:id

const removeExpense = async (req, res, next) => {
  try {
    // STEP 1: Find the expense
    const expense = await getExpenseById(req.params.id);

    if (!expense) {
      return next(new AppError("Expense not found", 404));
    }

    // STEP 2: Ownership check
    if (expense.user_id !== req.userId) {
      return next(
        new AppError("You do not have permission to delete this expense", 403),
      );
    }

    // STEP 3: Delete
    await deleteExpense(req.params.id);

    // 204 = No Content — success but nothing to return
    // Convention for DELETE requests
    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ─── DASHBOARD SUMMARY ────────────────────────────────────
// GET /api/expenses/summary
// Returns monthly totals + this month's category breakdown

const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Run both queries at the same time with Promise.all
    // Much faster than running them one after the other
    const [monthly, categories, monthlyTotal, user] = await Promise.all([
      getMonthlySummary(req.userId),
      getCategoryTotals(req.userId, month, year),
      getMonthlyTotal(req.userId, month, year),
      findById(req.userId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        monthlyTrend: monthly, // for bar chart
        categoryBreakdown: categories, // for pie chart
        currentMonth: {
          month,
          year,
          total: monthlyTotal,
          budget: user.monthly_budget,
          remaining: Math.max(0, user.monthly_budget - monthlyTotal),
          percentUsed:
            user.monthly_budget > 0
              ? Math.round((monthlyTotal / user.monthly_budget) * 100)
              : 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── CSV EXPORT ───────────────────────────────────────────
// GET /api/expenses/export
// Downloads all user's expenses as a CSV file

const exportCSV = async (req, res, next) => {
  try {
    const expenses = await getExpensesByUser(req.userId);

    // Build CSV string manually — no library needed
    const headers = ["Date", "Title", "Category", "Amount", "Note"];
    const rows = expenses.map((e) => [
      e.expense_date,
      `"${e.title.replace(/"/g, '""')}"`, // escape quotes in title
      e.category,
      e.amount,
      `"${(e.note || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    // Tell the browser this is a file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="expenses.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllExpenses,
  getSingleExpense,
  addExpense,
  editExpense,
  removeExpense,
  getSummary,
  exportCSV,
};
