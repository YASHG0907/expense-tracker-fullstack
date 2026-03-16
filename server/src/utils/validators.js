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

module.exports = { registerSchema, loginSchema };
