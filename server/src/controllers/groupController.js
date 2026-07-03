// src/controllers/groupController.js

const {
  createGroup,
  addMember,
  recalculateEqualShares,
  getGroupById,
  getGroupMembers,
  isMember,
  getUserGroups,
  createGroupExpense,
  getGroupExpenses,
} = require("../models/groupModel");

const { findByEmail, findById } = require("../models/userModel");
const {
  createGroupSchema,
  addGroupExpenseSchema,
} = require("../utils/validators");
const {
  calculateBalances,
  simplifySettlements,
} = require("../utils/settlementCalculator");
const AppError = require("../utils/AppError");

// ─── CREATE GROUP ──────────────────────────────────────────
// POST /api/groups
// Body: { name, monthly_limit, memberEmails: ["a@x.com", "b@x.com"] }

const createNewGroup = async (req, res, next) => {
  try {
    // STEP 1: Validate input
    const { error, value } = createGroupSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return next(new AppError(messages, 400));
    }

    const { name, monthly_limit, memberEmails } = value;

    // STEP 2: Look up each invited email — they must already have an account
    // We can't add someone to a group if they haven't registered yet
    const memberLookups = await Promise.all(
      memberEmails.map((email) => findByEmail(email)),
    );

    // Find which emails didn't match any registered user
    const notFound = memberEmails.filter((email, idx) => !memberLookups[idx]);

    if (notFound.length > 0) {
      return next(
        new AppError(
          `These emails are not registered: ${notFound.join(", ")}`,
          404,
        ),
      );
    }

    // STEP 3: Create the group
    const groupId = await createGroup(name, req.userId, monthly_limit);

    // STEP 4: Add the creator as a member first
    await addMember(groupId, req.userId, 0); // share gets recalculated next

    // STEP 5: Add each invited member
    for (const user of memberLookups) {
      await addMember(groupId, user.id, 0);
    }

    // STEP 6: Recalculate equal shares now that all members are added
    // e.g. 3 total members → each gets 33.33%
    await recalculateEqualShares(groupId);

    // STEP 7: Return the complete group with its members
    const group = await getGroupById(groupId);
    const members = await getGroupMembers(groupId);

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: { ...group, members },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ALL MY GROUPS ─────────────────────────────────────
// GET /api/groups

const getMyGroups = async (req, res, next) => {
  try {
    const groups = await getUserGroups(req.userId);
    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE GROUP DETAILS ──────────────────────────────
// GET /api/groups/:id

const getGroupDetails = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const group = await getGroupById(groupId);
    if (!group) {
      return next(new AppError("Group not found", 404));
    }

    // Authorization: only members can view group details
    const userIsMember = await isMember(groupId, req.userId);
    if (!userIsMember) {
      return next(new AppError("You are not a member of this group", 403));
    }

    const members = await getGroupMembers(groupId);
    const expenses = await getGroupExpenses(groupId);

    res.status(200).json({
      success: true,
      data: { ...group, members, expenses },
    });
  } catch (err) {
    next(err);
  }
};

// ─── ADD A GROUP EXPENSE ────────────────────────────────────
// POST /api/groups/:id/expenses
// Body: { title, amount, expense_date, note, paid_by (optional) }

const addGroupExpenseHandler = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    // STEP 1: Confirm group exists
    const group = await getGroupById(groupId);
    if (!group) {
      return next(new AppError("Group not found", 404));
    }

    // STEP 2: Confirm requester is a member
    const userIsMember = await isMember(groupId, req.userId);
    if (!userIsMember) {
      return next(new AppError("You are not a member of this group", 403));
    }

    // STEP 3: Validate request body
    const { error, value } = addGroupExpenseSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return next(new AppError(messages, 400));
    }

    // STEP 4: Determine who paid — defaults to the logged-in user
    const paidBy = value.paid_by || req.userId;

    // STEP 5: The person who paid must ALSO be a member of the group
    // (you can't log an expense as paid by someone outside the group)
    const payerIsMember = await isMember(groupId, paidBy);
    if (!payerIsMember) {
      return next(
        new AppError("The payer must be a member of this group", 400),
      );
    }

    // STEP 6: Create the expense
    const expense = await createGroupExpense(groupId, paidBy, value);

    res.status(201).json({
      success: true,
      message: "Group expense added successfully",
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET SETTLEMENT BALANCES ───────────────────────────────
// GET /api/groups/:id/balances
// THE BIG ONE — returns who owes whom

const getGroupBalances = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const group = await getGroupById(groupId);
    if (!group) {
      return next(new AppError("Group not found", 404));
    }

    const userIsMember = await isMember(groupId, req.userId);
    if (!userIsMember) {
      return next(new AppError("You are not a member of this group", 403));
    }

    // STEP 1: Fetch raw data
    const members = await getGroupMembers(groupId);
    const expenses = await getGroupExpenses(groupId);

    // STEP 2: Reshape data into the format our pure functions expect
    const memberInput = members.map((m) => ({
      userId: m.user_id,
      name: m.name,
      sharePercentage: parseFloat(m.share_percentage),
    }));

    const expenseInput = expenses.map((e) => ({
      paidBy: e.paid_by,
      amount: e.amount,
    }));

    // STEP 3: Run the algorithm
    const balances = calculateBalances(memberInput, expenseInput);
    const settlements = simplifySettlements(balances);

    const totalSpent = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount),
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        groupName: group.name,
        totalSpent: Math.round(totalSpent * 100) / 100,
        balances, // who's owed what / who owes what
        settlements, // the simplified minimum-transaction list
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createNewGroup,
  getMyGroups,
  getGroupDetails,
  addGroupExpenseHandler,
  getGroupBalances,
};
