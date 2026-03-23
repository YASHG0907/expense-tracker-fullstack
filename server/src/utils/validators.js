// src/utils/validators.js

const Joi = require("joi");

// Joi validates the request body BEFORE it hits your database
// If validation fails, you get a clear error message instead of a DB crash

// Schema for user registration
const registerSchema = Joi.object({
  name: Joi.string()
    .min(2) // at least 2 characters
    .max(100)
    .required()
    .messages({
      "string.min": "Name must be at least 2 characters",
      "any.required": "Name is required",
    }),

  email: Joi.string()
    .email() // must be valid email format
    .required()
    .messages({
      "string.email": "Please provide a valid email",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(6) // at least 6 characters
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required",
    }),

  monthly_budget: Joi.number().min(0).default(0), // optional — defaults to 0 if not provided
});

// Schema for login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Add this to src/utils/validators.js

const VALID_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Health",
  "Entertainment",
  "Housing",
  "Utilities",
  "Education",
  "Travel",
  "Other",
];

const createExpenseSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({ "any.required": "Title is required" }),

  amount: Joi.number()
    .positive() // must be greater than 0
    .precision(2) // max 2 decimal places
    .required()
    .messages({
      "number.positive": "Amount must be greater than 0",
      "any.required": "Amount is required",
    }),

  category: Joi.string()
    .valid(...VALID_CATEGORIES) // must be one of the valid values
    .required()
    .messages({
      "any.only": `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
    }),

  expense_date: Joi.date()
    .max("now") // can't add future expenses
    .required()
    .messages({
      "date.max": "Expense date cannot be in the future",
      "any.required": "Date is required",
    }),

  note: Joi.string()
    .max(500)
    .allow("") // empty string is ok
    .optional(),
});

// For update — all fields optional (only send what changed)
const updateExpenseSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  amount: Joi.number().positive().precision(2),
  category: Joi.string().valid(...VALID_CATEGORIES),
  expense_date: Joi.date().max("now"),
  note: Joi.string().max(500).allow("").optional(),
}).min(1); // at least one field must be provided

// Replace the existing module.exports with this
module.exports = {
  registerSchema,
  loginSchema,
  createExpenseSchema,
  updateExpenseSchema,
};
