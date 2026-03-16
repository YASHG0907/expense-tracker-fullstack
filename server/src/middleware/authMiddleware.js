// src/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const protect = async (req, res, next) => {
  try {
    // STEP 1: Get token from the Authorization header
    // The frontend sends: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        new AppError("You must be logged in to access this route", 401),
      );
    }

    // Extract just the token part (remove "Bearer ")
    const token = authHeader.split(" ")[1];

    // STEP 2: Verify the token
    // jwt.verify throws an error if:
    // - token is invalid (tampered)
    // - token is expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // STEP 3: Attach userId to the request object
    // Now any controller that runs after this middleware
    // can access req.userId to know who made the request
    req.userId = decoded.id;
    req.userEmail = decoded.email;

    // STEP 4: Move to the next function (the actual route handler)
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again", 401));
    }
    if (err.name === "TokenExpiredError") {
      return next(
        new AppError("Your session has expired. Please log in again", 401),
      );
    }
    next(err);
  }
};

module.exports = { protect };
