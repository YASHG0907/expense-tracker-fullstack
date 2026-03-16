// src/routes/auth.js

const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Apply a strict rate limiter to login specifically
// This prevents brute force attacks (trying 1000 passwords)
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // only 5 login attempts per 15 minutes per IP
  message: {
    success: false,
    message: "Too many login attempts. Please wait 15 minutes and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// PUBLIC ROUTES — no token needed
// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login  ← rate limited
router.post("/login", authLimiter, login);

// PROTECTED ROUTE — requires valid JWT
// GET /api/auth/me
router.get("/me", protect, getMe);
// protect runs first → if token valid → getMe runs
// if token invalid → protect sends 401, getMe never runs

module.exports = router;
