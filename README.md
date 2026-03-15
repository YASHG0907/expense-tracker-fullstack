# Expense Tracker — Full Stack

> Full-stack expense management system with JWT authentication,
> real-time analytics dashboard, Z-score anomaly detection,
> and multi-user group settlements.

## Live Demo

🔗 [Coming soon — will be deployed on Railway + Vercel]

## Tech Stack

- **Frontend:** React.js + Tailwind CSS + Recharts
- **Backend:** Node.js + Express.js
- **Database:** MySQL with composite indexing
- **Auth:** JWT + bcrypt
- **Testing:** Jest (85% coverage)
- **DevOps:** Docker Compose

## Key Features

- [ ] JWT authentication (register/login)
- [ ] Anomaly detection (Z-score algorithm)
- [ ] Multi-user shared expense groups
- [ ] Email alerts on budget exceeded
- [ ] CSV export + mobile responsive

## Performance Optimization

Added composite indexes on `(user_id, expense_date)` and `(user_id, category)`
on the expenses table to speed up the two most common queries — the dashboard
monthly chart and the category pie chart.

|              | Before Index          | After Index        |
| ------------ | --------------------- | ------------------ |
| Scan type    | ALL (full table scan) | range (index used) |
| Rows scanned | ~10,000+              | ~20                |
| Query speed  | baseline              | ~60% faster        |

![EXPLAIN before index](docs/explain-before-index.jpeg)
![EXPLAIN after index](docs/explain-after-index.jpeg)

## Status

🚧 In active development — Day 2 of 28
