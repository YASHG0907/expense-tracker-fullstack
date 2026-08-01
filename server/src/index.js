require("dotenv").config();
const express = require("express");
const requestId = require("./middleware/requestId");
const morgan = require("morgan");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Import DB connection — runs the connection test on startup
require("./config/db");

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ─────────────────────────────────────────
// Middleware = code that runs on EVERY request, in order

app.use(requestId);

// Register a custom Morgan token that pulls req.requestId
morgan.token("reqid", (req) => req.requestId);

// 4. Morgan — logs every request to console
if (process.env.NODE_ENV === "test") {
  // no logging during tests
} else if (process.env.NODE_ENV === "production") {
  app.use(
    morgan(
      ":reqid :method :url :status :response-time ms - :res[content-length]",
    ),
  );
} else {
  app.use(morgan(":reqid :method :url :status :response-time ms"));
}

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

// ─── REQUEST ID (must come before logging) ─────────────

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
app.use("/api/groups", require("./routes/groups"));
app.use("/api/analytics", require("./routes/analytics"));

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
// Catches every error thrown anywhere in the app via next(err)
// Translates different error types into consistent, safe responses

app.use((err, req, res, next) => {
  // Log the full error server-side for debugging —
  // this never gets sent to the client
  console.error(`❌ Error [${req.requestId}]:`, err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // ─── MySQL-specific errors ──────────────────────────────
  // err.code comes from the mysql2 driver, not from our AppError class

  if (err.code === "ER_DUP_ENTRY") {
    // Happens when a UNIQUE constraint is violated
    // (e.g. trying to register with an email that's already used,
    // but somehow slipped past our manual check)
    statusCode = 409;
    message = "This record already exists";
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    // Foreign key violation — e.g. trying to add an expense
    // for a user_id that doesn't exist in the users table
    statusCode = 400;
    message = "Referenced record does not exist";
  }

  if (err.code === "ECONNREFUSED") {
    // Database connection dropped mid-request
    statusCode = 503;
    message = "Database temporarily unavailable. Please try again.";
  }

  // ─── JWT-specific errors ────────────────────────────────
  // These can also surface here if jwt.verify is called
  // somewhere outside the auth middleware's own try/catch

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expired. Please log in again";
  }

  // ─── NEVER leak internal details in production ─────────
  // If we somehow end up with a raw 500 and no clean message,
  // don't expose database structure or file paths to the client
  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "Something went wrong. Please try again later.";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
});

// ─── START SERVER ───────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

module.exports = app;
