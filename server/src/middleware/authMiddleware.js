const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        new AppError("You must be logged in to access this route", 401),
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // parseInt() fixes the type mismatch between JWT string and MySQL number
    req.userId = parseInt(decoded.id);
    req.userEmail = decoded.email;

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
