-- Expense Tracker Database Schema
-- Run this entire file in MySQL Workbench

USE expense_tracker;

-- ─── TABLE 1: users ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(150)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  monthly_budget  DECIMAL(10,2) DEFAULT 0.00,
  last_alert_sent DATE          DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── TABLE 2: expenses ───────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id           INT           AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           NOT NULL,
  title        VARCHAR(200)  NOT NULL,
  amount       DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  category     ENUM(
    'Food', 'Transport', 'Shopping', 'Health',
    'Entertainment', 'Housing', 'Utilities',
    'Education', 'Travel', 'Other'
  ) NOT NULL DEFAULT 'Other',
  expense_date DATE          NOT NULL,
  note         TEXT          DEFAULT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key: expense must belong to a real user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- PERFORMANCE INDEXES
  -- Index 1: speeds up dashboard query (filter by user + date range)
  INDEX idx_user_date     (user_id, expense_date),

  -- Index 2: speeds up pie chart query (filter by user + category)
  INDEX idx_user_category (user_id, category),

  -- Index 3: speeds up sorting by amount
  INDEX idx_amount        (amount)
);

-- ─── TABLE 3: budget_groups ──────────────────────────────
CREATE TABLE IF NOT EXISTS budget_groups (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  created_by    INT           NOT NULL,
  monthly_limit DECIMAL(10,2) DEFAULT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── TABLE 4: group_members ──────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id               INT          AUTO_INCREMENT PRIMARY KEY,
  group_id         INT          NOT NULL,
  user_id          INT          NOT NULL,
  share_percentage DECIMAL(5,2) DEFAULT 100.00,
  joined_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (group_id) REFERENCES budget_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)          ON DELETE CASCADE,

  -- Prevent same user being added to same group twice
  UNIQUE KEY unique_member (group_id, user_id)
);

-- ─── TABLE 5: group_expenses ─────────────────────────────
CREATE TABLE IF NOT EXISTS group_expenses (
  id           INT           AUTO_INCREMENT PRIMARY KEY,
  group_id     INT           NOT NULL,
  paid_by      INT           NOT NULL,
  title        VARCHAR(200)  NOT NULL,
  amount       DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  expense_date DATE          NOT NULL,
  note         TEXT          DEFAULT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (group_id) REFERENCES budget_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (paid_by)  REFERENCES users(id)          ON DELETE CASCADE
);

-- Verify all tables were created
SHOW TABLES;