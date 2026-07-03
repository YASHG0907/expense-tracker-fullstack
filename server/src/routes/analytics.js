// src/routes/analytics.js

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getDashboard,
  getTrends,
} = require("../controllers/analyticsController");

router.use(protect);

router.get("/dashboard", getDashboard);
router.get("/trends", getTrends);

module.exports = router;
