// server/src/middleware/requestId.js

const { randomUUID } = require("crypto");

// Attaches a unique ID to every incoming request.
// Uses Node's built-in crypto.randomUUID() (available since Node 14.17+)
// instead of the uuid package — avoids an ESM/CommonJS resolution
// conflict with Jest, and removes an unnecessary dependency entirely.

const requestId = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};

module.exports = requestId;
