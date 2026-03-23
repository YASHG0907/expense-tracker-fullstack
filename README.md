# Expense Tracker — Full Stack

> A production-grade full-stack expense management system built with
> Node.js, Express, MySQL, and React. Features JWT authentication,
> real-time analytics dashboard, Z-score anomaly detection, and
> multi-user group expense settlements.

## 🔗 Live Demo

**Coming Week 4** — deploying on Railway (API) + Vercel (Frontend)

---

## 🛠️ Tech Stack

| Layer      | Technology               | Purpose                        |
| ---------- | ------------------------ | ------------------------------ |
| Frontend   | React.js + Tailwind CSS  | UI and styling                 |
| Charts     | Recharts                 | Bar and pie chart dashboards   |
| Backend    | Node.js + Express.js     | REST API server                |
| Database   | MySQL 8                  | Persistent data storage        |
| Auth       | JWT + bcrypt             | Secure authentication          |
| Validation | Joi                      | Request body validation        |
| Security   | express-rate-limit, CORS | Rate limiting and cross-origin |
| Logging    | Morgan                   | HTTP request logging           |
| Testing    | Jest + Supertest         | Unit and integration tests     |
| DevOps     | Docker Compose           | Containerized deployment       |
| Deployment | Railway + Vercel         | Free cloud hosting             |

---

## ✅ Features

### Built (Days 1–4)

- [x] MySQL schema — 5 tables with foreign keys and composite indexes
- [x] Express server with full middleware stack
- [x] JWT authentication — register, login, get current user
- [x] Password hashing with bcrypt (saltRounds: 10)
- [x] Joi request validation with descriptive error messages
- [x] JWT middleware protecting all private routes
- [x] Login rate limiting — 5 attempts per 15 minutes per IP
- [x] Global error handler with correct HTTP status codes
- [x] Expense CRUD — create, read, update, delete
- [x] Ownership validation — users can only edit their own expenses
- [x] Dynamic query filtering — by month, year, and category
- [x] Monthly summary endpoint for bar chart data
- [x] Category breakdown endpoint for pie chart data
- [x] Budget exceeded warning on expense creation
- [x] CSV export of all expenses

### Coming Next

- [ ] Z-score anomaly detection algorithm (Day 5)
- [ ] Multi-user shared expense groups — Splitwise-like (Day 6–7)
- [ ] Analytics API endpoints (Day 7)
- [ ] React frontend with Tailwind CSS (Week 2)
- [ ] Analytics dashboard with bar and pie charts (Week 2)
- [ ] Jest test suite — 85% coverage target (Week 3)
- [ ] Docker Compose full containerization (Week 3)
- [ ] Email alerts when monthly budget exceeded (Week 3)
- [ ] GitHub Actions CI pipeline (Week 4)
- [ ] Production deployment on Railway + Vercel (Week 4)

---

## 🔐 API Reference

### Base URL

```
Development: http://localhost:5000
Production:  https://your-app.up.railway.app  (Week 4)
```

### Authentication Header

All protected routes require this header:

```
Authorization: Bearer <your_jwt_token>
```

---

### Auth Endpoints

| Method | Endpoint             | Auth | Description                 |
| ------ | -------------------- | ---- | --------------------------- |
| POST   | `/api/auth/register` | No   | Create a new account        |
| POST   | `/api/auth/login`    | No   | Login and receive JWT token |
| GET    | `/api/auth/me`       | Yes  | Get logged-in user details  |

**POST /api/auth/register**

```json
// Request
{
  "name": "Rahul Desai",
  "email": "rahul@example.com",
  "password": "password123",
  "monthly_budget": 15000
}

// Response 201
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Rahul Desai",
    "email": "rahul@example.com",
    "monthly_budget": 15000
  }
}
```

**POST /api/auth/login**

```json
// Request
{
  "email": "rahul@example.com",
  "password": "password123"
}

// Response 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Rahul Desai",
    "email": "rahul@example.com",
    "monthly_budget": 15000
  }
}
```

---

### Expense Endpoints

All expense endpoints require `Authorization: Bearer <token>`

| Method | Endpoint                          | Description                                      |
| ------ | --------------------------------- | ------------------------------------------------ |
| GET    | `/api/expenses`                   | Get all expenses (with optional filters)         |
| GET    | `/api/expenses?month=3&year=2025` | Filter by month and year                         |
| GET    | `/api/expenses?category=Food`     | Filter by category                               |
| POST   | `/api/expenses`                   | Create a new expense                             |
| GET    | `/api/expenses/:id`               | Get a single expense                             |
| PUT    | `/api/expenses/:id`               | Update an expense                                |
| DELETE | `/api/expenses/:id`               | Delete an expense                                |
| GET    | `/api/expenses/summary`           | Dashboard data — monthly trend + category totals |
| GET    | `/api/expenses/export`            | Download all expenses as CSV                     |

**POST /api/expenses**

```json
// Request
{
  "title": "Grocery at Big Bazaar",
  "amount": 1850,
  "category": "Food",
  "expense_date": "2025-03-15",
  "note": "Weekly grocery run"
}

// Response 201
{
  "success": true,
  "message": "Expense added successfully",
  "data": {
    "id": 1,
    "title": "Grocery at Big Bazaar",
    "amount": "1850.00",
    "category": "Food",
    "expense_date": "2025-03-15T00:00:00.000Z",
    "note": "Weekly grocery run"
  },
  "budgetWarning": null
}
```

**GET /api/expenses/summary**

```json
// Response 200
{
  "success": true,
  "data": {
    "monthlyTrend": [
      { "year": 2025, "month": 1, "total": "14250.00", "count": 8 },
      { "year": 2025, "month": 2, "total": "16800.00", "count": 10 },
      { "year": 2025, "month": 3, "total": "14350.00", "count": 5 }
    ],
    "categoryBreakdown": [
      { "category": "Housing", "total": "9500.00", "count": 1 },
      { "category": "Food", "total": "2330.00", "count": 2 },
      { "category": "Utilities", "total": "2200.00", "count": 1 }
    ],
    "currentMonth": {
      "month": 3,
      "year": 2025,
      "total": 14350,
      "budget": 15000,
      "remaining": 650,
      "percentUsed": 96
    }
  }
}
```

---

### Valid Expense Categories

```
Food | Transport | Shopping | Health | Entertainment
Housing | Utilities | Education | Travel | Other
```

---

## ⚡ Performance — Database Optimization

Composite indexes on the `expenses` table eliminate full table scans on the most frequent query patterns.

### Indexes Added

```sql
-- Powers dashboard queries (filter by user + date range)
INDEX idx_user_date (user_id, expense_date)

-- Powers pie chart queries (filter by user + category)
INDEX idx_user_category (user_id, category)

-- Powers amount-based sorting and filtering
INDEX idx_amount (amount)
```

### EXPLAIN Verification

The query used for the main dashboard — fetching a user's expenses across a date range:

```sql
EXPLAIN SELECT expense_date, SUM(amount) AS total, category
FROM expenses
WHERE user_id = 1
AND expense_date BETWEEN '2025-01-01' AND '2025-03-31'
GROUP BY expense_date, category
ORDER BY expense_date;
```

**Result — index is being used:**

![EXPLAIN before index](docs/explain-before-index.jpeg)
![EXPLAIN after index](docs/explain-after-index.jpeg)

| Column | Value                 | Meaning                                        |
| ------ | --------------------- | ---------------------------------------------- |
| type   | range                 | Index range scan — NOT a full table scan       |
| key    | idx_user_date         | Our composite index is being used ✓            |
| rows   | ~20                   | Scans only matching rows, not the entire table |
| Extra  | Using index condition | Query resolved entirely from index             |

Without the index, `type` would be `ALL` and `rows` would equal the total table size.
On a table with 1,920 rows, that means 1,920 rows scanned vs ~305 rows — a reduction of over 84%.

---

## 🗄️ Database Schema

### Entity Relationship

```
users (1) ──────────────── (many) expenses
  │                                user_id FK → users.id
  │
  └──── (1) ─── (many) budget_groups
                  created_by FK → users.id
                       │
                       └──── (many) group_members
                               group_id FK → budget_groups.id
                               user_id  FK → users.id
                       │
                       └──── (many) group_expenses
                               group_id FK → budget_groups.id
                               paid_by  FK → users.id
```

### Table Definitions

```sql
users
  id, name, email, password_hash, monthly_budget,
  last_alert_sent, created_at, updated_at

expenses
  id, user_id (FK), title, amount, category (ENUM),
  expense_date, note, created_at, updated_at

budget_groups
  id, name, created_by (FK), monthly_limit, created_at

group_members
  id, group_id (FK), user_id (FK), share_percentage, joined_at

group_expenses
  id, group_id (FK), paid_by (FK), title, amount,
  expense_date, note, created_at
```

---

## 🔒 Security Implementation

| Concern          | Implementation                                                                |
| ---------------- | ----------------------------------------------------------------------------- |
| Password storage | bcrypt hash, saltRounds: 10. Plain passwords never stored or logged           |
| Token security   | JWT signed with secret from `.env`, expires in 7 days                         |
| Brute force      | Login rate limited to 5 requests per 15 minutes per IP                        |
| SQL injection    | Parameterized queries (`?` placeholders) throughout all models                |
| Input validation | Joi schemas validate every request body before it touches the database        |
| Ownership        | Every update/delete checks `expense.user_id === req.userId` before proceeding |
| User enumeration | Login returns identical message for wrong email and wrong password            |
| CORS             | Only the frontend origin is whitelisted                                       |
| Secrets          | All credentials in `.env` — never committed to Git                            |

---

## 🚀 Getting Started

### Prerequisites

```
Node.js v20+
MySQL 8
Git
Docker Desktop (optional — Week 3)
```

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/expense-tracker-fullstack.git
cd expense-tracker-fullstack

# 2. Install backend dependencies
cd server
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env — fill in your MySQL password and a JWT secret
```

Your `.env` should look like:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=expense_tracker
JWT_SECRET=make_this_a_long_random_string_at_least_32_chars
JWT_EXPIRES_IN=7d
```

```bash
# 4. Create the database tables
# Open MySQL Workbench, connect to localhost
# Open and run: server/src/config/schema.sql

# 5. Start the development server
npm run dev

# Server starts on http://localhost:5000
# You should see:
# ✅ MySQL connected successfully
# 🚀 Server running on http://localhost:5000
```

### Verify it works

Open your browser: [http://localhost:5000/health](http://localhost:5000/health)

Expected response:

```json
{ "success": true, "message": "Server is running" }
```

---

## 📁 Project Structure

```
expense-tracker-fullstack/
│
├── client/                          # React frontend (Week 2)
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # MySQL connection pool (mysql2/promise)
│   │   │   └── schema.sql           # Database schema — all 5 tables
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js              # POST /register, POST /login, GET /me
│   │   │   └── expenses.js          # Full CRUD + summary + export
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js    # register, login, getMe logic
│   │   │   └── expenseController.js # getAllExpenses, addExpense, editExpense...
│   │   │
│   │   ├── models/
│   │   │   ├── userModel.js         # findByEmail, findById, createUser
│   │   │   └── expenseModel.js      # all expense SQL queries
│   │   │
│   │   ├── middleware/
│   │   │   └── authMiddleware.js    # JWT verification → attaches req.userId
│   │   │
│   │   ├── utils/
│   │   │   ├── AppError.js          # Custom error class with statusCode
│   │   │   └── validators.js        # Joi schemas for all request bodies
│   │   │
│   │   └── index.js                 # Express app — middleware + routes + server
│   │
│   ├── tests/                       # Jest tests (Week 3)
│   ├── .env.example                 # Template — copy to .env and fill in values
│   └── package.json
│
├── docs/
│   └── explain-index.png            # EXPLAIN query screenshot (Day 2)
│
├── docker-compose.yml               # Full stack container setup (Week 3)
└── README.md
```

---

## 📊 Build Progress

| Day    | What Was Built                                                       | Status     |
| ------ | -------------------------------------------------------------------- | ---------- |
| Day 1  | Environment setup, Git, GitHub repo, folder structure                | ✅ Done    |
| Day 2  | Express server, MySQL schema with 5 tables and composite indexes     | ✅ Done    |
| Day 3  | JWT auth — register, login, protected routes, bcrypt, Joi validation | ✅ Done    |
| Day 4  | Expense CRUD API — GET/POST/PUT/DELETE, ownership checks, CSV export | ✅ Done    |
| Day 5  | Z-score anomaly detection algorithm                                  | 🔄 Next    |
| Day 6  | Group expenses and settlements                                       | ⏳ Pending |
| Day 7  | Analytics endpoints for charts                                       | ⏳ Pending |
| Week 2 | React frontend — auth pages, expense list, dashboard, charts         | ⏳ Pending |
| Week 3 | Jest tests, Docker Compose, email alerts                             | ⏳ Pending |
| Week 4 | Deploy, CI/CD pipeline, README polish                                | ⏳ Pending |

---

_Portfolio project for engineering campus placements — demonstrating full-stack development with Node.js, Express, MySQL, React, and DevOps practices._
