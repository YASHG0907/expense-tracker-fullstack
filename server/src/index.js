require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// Import DB connection — runs the connection test on startup
require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ─────────────────────────────────────────
// Middleware = code that runs on EVERY request, in order

// 1. CORS — lets React (port 3000) talk to this API (port 5000)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// 2. JSON parser — reads req.body as a JavaScript object
// Without this line, req.body is always undefined
app.use(express.json());

// 3. URL-encoded body parser (for form submissions)
app.use(express.urlencoded({ extended: true }));

// 4. Morgan — logs every request to console
// Shows: POST /api/auth/login 200 45ms
app.use(morgan("dev"));

// 5. Global rate limiter — max 100 reqs per 15 mins per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests" },
});
app.use("/api", globalLimiter);

// ─── ROUTES ─────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/expenses", require("./routes/expenses"));
// app.use('/api/expenses', require('./routes/expenses')); ← Day 4

// ─── HEALTH CHECK ───────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 HANDLER ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── GLOBAL ERROR HANDLER ───────────────────────────────
// 4 params = Express knows this is the error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ─── START SERVER ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
