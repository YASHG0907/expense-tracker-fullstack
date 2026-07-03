// src/routes/groups.js

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createNewGroup,
  getMyGroups,
  getGroupDetails,
  addGroupExpenseHandler,
  getGroupBalances,
} = require("../controllers/groupController");

// All group routes require login
router.use(protect);

router.post("/", createNewGroup);
router.get("/", getMyGroups);
router.get("/:id", getGroupDetails);
router.post("/:id/expenses", addGroupExpenseHandler);
router.get("/:id/balances", getGroupBalances);

module.exports = router;
