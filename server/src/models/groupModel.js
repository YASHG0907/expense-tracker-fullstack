// src/models/groupModel.js

const pool = require("../config/db");

// ─── CREATE A NEW GROUP ────────────────────────────────────

const createGroup = async (name, createdBy, monthlyLimit) => {
  const [result] = await pool.query(
    "INSERT INTO budget_groups (name, created_by, monthly_limit) VALUES (?, ?, ?)",
    [name, createdBy, monthlyLimit || null],
  );
  return result.insertId;
};

// ─── ADD A MEMBER TO A GROUP ───────────────────────────────

const addMember = async (groupId, userId, sharePercentage) => {
  await pool.query(
    `INSERT INTO group_members (group_id, user_id, share_percentage) 
     VALUES (?, ?, ?)`,
    [groupId, userId, sharePercentage],
  );
};

// ─── RECALCULATE EQUAL SHARES FOR ALL MEMBERS ──────────────
// Whenever the member count changes, everyone's share
// needs to update so the percentages still add up to 100

const recalculateEqualShares = async (groupId) => {
  // First, count how many members are currently in the group
  const [countRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM group_members WHERE group_id = ?",
    [groupId],
  );
  const totalMembers = countRows[0].total;

  if (totalMembers === 0) return;

  const equalShare = 100 / totalMembers;

  // Update every member's share_percentage to the new equal value
  await pool.query(
    "UPDATE group_members SET share_percentage = ? WHERE group_id = ?",
    [equalShare, groupId],
  );
};

// ─── GET A GROUP BY ID ─────────────────────────────────────

const getGroupById = async (groupId) => {
  const [rows] = await pool.query("SELECT * FROM budget_groups WHERE id = ?", [
    groupId,
  ]);
  return rows[0];
};

// ─── GET ALL MEMBERS OF A GROUP (with their names) ────────
// JOIN pulls the user's name from the users table
// instead of just showing a raw user_id number

const getGroupMembers = async (groupId) => {
  const [rows] = await pool.query(
    `SELECT 
       gm.user_id,
       u.name,
       u.email,
       gm.share_percentage,
       gm.joined_at
     FROM group_members gm
     JOIN users u ON gm.user_id = u.id
     WHERE gm.group_id = ?`,
    [groupId],
  );
  return rows;
};

// ─── CHECK IF A USER IS A MEMBER OF A GROUP ────────────────
// Critical for authorization — only members can view/add expenses

const isMember = async (groupId, userId) => {
  const [rows] = await pool.query(
    "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
    [groupId, userId],
  );
  return rows.length > 0;
};

// ─── GET ALL GROUPS A USER BELONGS TO ──────────────────────

const getUserGroups = async (userId) => {
  const [rows] = await pool.query(
    `SELECT 
       bg.id,
       bg.name,
       bg.monthly_limit,
       bg.created_by,
       bg.created_at,
       (SELECT COUNT(*) FROM group_members WHERE group_id = bg.id) AS member_count
     FROM budget_groups bg
     JOIN group_members gm ON bg.id = gm.group_id
     WHERE gm.user_id = ?
     ORDER BY bg.created_at DESC`,
    [userId],
  );
  return rows;
};

// ─── CREATE A GROUP EXPENSE ────────────────────────────────

const createGroupExpense = async (groupId, paidBy, data) => {
  const { title, amount, expense_date, note } = data;

  const [result] = await pool.query(
    `INSERT INTO group_expenses 
       (group_id, paid_by, title, amount, expense_date, note) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [groupId, paidBy, title, amount, expense_date, note || null],
  );

  const [rows] = await pool.query("SELECT * FROM group_expenses WHERE id = ?", [
    result.insertId,
  ]);
  return rows[0];
};

// ─── GET ALL EXPENSES FOR A GROUP ───────────────────────────

const getGroupExpenses = async (groupId) => {
  const [rows] = await pool.query(
    `SELECT 
       ge.id,
       ge.title,
       ge.amount,
       ge.expense_date,
       ge.note,
       ge.paid_by,
       u.name AS paid_by_name
     FROM group_expenses ge
     JOIN users u ON ge.paid_by = u.id
     WHERE ge.group_id = ?
     ORDER BY ge.expense_date DESC`,
    [groupId],
  );
  return rows;
};

module.exports = {
  createGroup,
  addMember,
  recalculateEqualShares,
  getGroupById,
  getGroupMembers,
  isMember,
  getUserGroups,
  createGroupExpense,
  getGroupExpenses,
};
