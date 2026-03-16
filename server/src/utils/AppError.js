// src/utils/AppError.js

// This is a custom Error class
// It extends JavaScript's built-in Error class
// So anywhere in the app you can do: throw new AppError("message", 404)
// and the global error handler in index.js catches it automatically

class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // calls the parent Error class
    this.statusCode = statusCode;
    this.isOperational = true; // marks it as a "known" error, not a bug
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
