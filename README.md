# Vault — Expense Tracker

Vault is a full-stack expense tracking web application that helps users manage their spending, monitor budgets, and visualise financial patterns over time.

## Problem it solves

Most people struggle to keep track of their day-to-day spending. Vault provides a clean, intuitive interface to log expenses, set monthly budgets, and see exactly where money is going — with real-time search, category breakdowns, and monthly trend charts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router DOM, Axios, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |

---

## How to run locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/samriddhisud/Vault.git
cd Vault
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000

Start the backend:
```bash
node server.js
```

### 3. Set up the frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Folder structure
Vault/
├── backend/                  # Express.js REST API
│   ├── middleware/
│   │   ├── auth.js           # JWT protect + adminOnly middleware
│   │   └── logActivity.js    # Activity logging helper
│   ├── models/
│   │   ├── User.js           # User schema (name, email, passwordHash, role)
│   │   ├── Expense.js        # Expense schema (userId, title, date, category, amount)
│   │   ├── Budget.js         # Budget schema (userId, monthlyBudget)
│   │   └── UserActivity.js   # Activity log schema (userId, action, detail)
│   ├── routes/
│   │   ├── auth.js           # Register, login, logout, profile, password routes
│   │   ├── expenses.js       # CRUD routes for expenses
│   │   ├── budget.js         # Get and update budget
│   │   └── admin.js          # Admin-only routes (users, activity, role management)
│   ├── .env                  # Environment variables (not committed)
│   ├── .env.example          # Example env file
│   └── server.js             # Express app entry point
│
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js      # Axios instance with JWT interceptor
│   │   ├── components/
│   │   │   ├── Navbar.jsx    # Top navigation with dark mode toggle
│   │   │   └── ToastContainer.jsx # Toast notification display
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global auth state (user, login, logout)
│   │   ├── hooks/
│   │   │   └── useToast.js   # Toast notification hook
│   │   ├── pages/
│   │   │   ├── Login.jsx     # Login page
│   │   │   ├── Register.jsx  # Register page
│   │   │   ├── Dashboard.jsx # Main dashboard with hero, stats, recent expenses
│   │   │   ├── Expenses.jsx  # Full CRUD expense management with live search
│   │   │   ├── Reports.jsx   # Bar chart + donut chart spending visualisation
│   │   │   ├── Admin.jsx     # Admin panel — users, activity log, expense drill-down
│   │   │   └── Profile.jsx   # Edit profile, change password, set budget
│   │   ├── App.jsx           # React Router setup with protected routes
│   │   ├── index.css         # Global design system (tokens, components, utilities)
│   │   └── main.jsx          # React entry point
│   └── package.json
│
├── database-export/          # Sample database exports
│   ├── users.json
│   ├── expenses.json
│   ├── budgets.json
│   └── user_activity.json
│
└── README.md

---

## Key features

- **JWT Authentication** — Secure register/login with bcrypt password hashing and 7-day JWT tokens
- **Role-based access control** — Admin and user roles, admin-only routes protected on both frontend and backend
- **Live search** — Real-time expense filtering as you type, searches title, category, description
- **Full CRUD** — Create, read, update, delete expenses with inline edit form and confirm-delete modal
- **Spending trends** — Bar chart (3/6/12 month range) and donut chart (category breakdown) using Chart.js
- **Budget tracking** — Monthly budget with progress bar, warning at 80%, danger at 100%
- **Activity logging** — Every login, logout, and CRUD action is logged and visible in the admin panel
- **Dark mode** — Full dark/light mode toggle persisted in localStorage
- **CSV export** — Export filtered expenses to CSV with one click
- **Relative timestamps** — "Today", "Yesterday", "3 days ago" on expense rows
- **Empty states** — Friendly empty states for all pages when no data exists
- **Toast notifications** — Non-blocking success/error feedback on every action

---

## Workload allocation

This was an individual submission. All files were written by Samriddhisud.

| Area | Files |
|---|---|
| Backend models | `backend/models/*.js` |
| Backend routes | `backend/routes/*.js` |
| Backend middleware | `backend/middleware/*.js` |
| Frontend pages | `frontend/src/pages/*.jsx` |
| Frontend components | `frontend/src/components/*.jsx` |
| Auth context + hooks | `frontend/src/context/`, `frontend/src/hooks/` |
| API layer | `frontend/src/api/index.js` |
| Global styles | `frontend/src/index.css` |
