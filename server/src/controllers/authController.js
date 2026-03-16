// src/controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findByEmail, createUser, findById } = require("../models/userModel");
const { registerSchema, loginSchema } = require("../utils/validators");
const AppError = require("../utils/AppError");

// ─── REGISTER ─────────────────────────────────────────────
// What happens: user sends { name, email, password, monthly_budget }
// What we do:
//   1. Validate the input with Joi
//   2. Check if email already exists
//   3. Hash the password with bcrypt
//   4. Insert user into database
//   5. Return a JWT token

const register = async (req, res, next) => {
  try {
    // STEP 1: Validate request body
    // abortEarly: false means collect ALL errors, not just the first one
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      // Extract all error messages into a readable string
      const messages = error.details.map((d) => d.message).join(", ");
      return next(new AppError(messages, 400));
    }

    const { name, email, password, monthly_budget } = value;

    // STEP 2: Check if email already in use
    const existingUser = await findByEmail(email);
    if (existingUser) {
      return next(
        new AppError("An account with this email already exists", 409),
      );
      // 409 = Conflict — standard HTTP status for "already exists"
    }

    // STEP 3: Hash the password
    // bcrypt.hash(password, saltRounds)
    // saltRounds = 10 means bcrypt runs 2^10 = 1024 iterations
    // Higher = more secure but slower. 10 is the industry standard.
    const hashedPassword = await bcrypt.hash(password, 10);

    // STEP 4: Create the user in the database
    const userId = await createUser(
      name,
      email,
      hashedPassword,
      monthly_budget,
    );

    // STEP 5: Create a JWT token
    // jwt.sign(payload, secret, options)
    // payload = data stored INSIDE the token (not encrypted, just signed)
    // secret = from your .env file — anyone with this can create fake tokens
    // expiresIn = token expires after this time, user must login again
    const token = jwt.sign(
      { id: userId, email: email }, // payload
      process.env.JWT_SECRET, // secret
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    // STEP 6: Send success response
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: userId,
        name,
        email,
        monthly_budget,
      },
    });
  } catch (err) {
    // Pass any unexpected errors to the global error handler
    next(err);
  }
};

// ─── LOGIN ────────────────────────────────────────────────
// What happens: user sends { email, password }
// What we do:
//   1. Validate input
//   2. Find user by email
//   3. Compare password with stored hash using bcrypt
//   4. Return a JWT token

const login = async (req, res, next) => {
  try {
    // STEP 1: Validate
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }

    const { email, password } = value;

    // STEP 2: Find user by email
    const user = await findByEmail(email);

    // Important: don't say "email not found" — that tells hackers
    // which emails are registered. Always say "invalid credentials".
    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    // STEP 3: Compare password
    // bcrypt.compare(plainPassword, hashedPassword)
    // returns true if they match, false if not
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return next(new AppError("Invalid email or password", 401));
    }

    // STEP 4: Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    // STEP 5: Send response (NEVER send password_hash back)
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthly_budget: user.monthly_budget,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────
// Protected route — requires a valid JWT token
// The auth middleware (created next) attaches req.userId before this runs

const getMe = async (req, res, next) => {
  try {
    const user = await findById(req.userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
