# Vault - Expense Tracker

Vault is a full-stack expense tracking web application that helps users take control of their personal finances. It allows users to log and categorise their daily spending, set monthly budgets, visualise trends over time, and receive real-time feedback when they are approaching or exceeding their limits. An admin panel provides full user management capabilities, including viewing all accounts, their activity logs, and managing user profiles.

---

## Problem it solves

Most people have no clear picture of where their money goes each month. Vault solves this by providing a clean, intuitive interface to log expenses by category, set a monthly budget, and instantly see how much has been spent and how much remains - all without leaving the app. The reporting page gives a visual breakdown of spending patterns across months and categories, helping users identify habits and make better financial decisions.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router DOM v6, Axios, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose ODM |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| Styling | Custom CSS design system (CSS variables, no UI framework) |

---

## Architecture

Vault follows a classic three-tier architecture: a React SPA on the frontend, an Express REST API on the backend, and a MongoDB Atlas database in the cloud.

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                     │
│                                                         │
│   ┌─────────────┐     React Router      ┌────────────┐  │
│   │  React SPA  │ ──── navigates ─────▶ │   Pages    │  │
│   │  (Vite)     │                       │ Dashboard  │  │
│   └──────┬──────┘                       │ Expenses   │  │
│          │                              │ Reports    │  │
│   Axios + JWT interceptor               │ Admin      │  │
│   (Authorization: Bearer token)         │ Profile    │  │
│          │                              └────────────┘  │
└──────────┼──────────────────────────────────────────────┘
           │ HTTP requests (JSON)
           ▼
┌─────────────────────────────────────────────────────────┐
│                  EXPRESS REST API (Node.js)              │
│                                                         │
│   ┌──────────┐  ┌───────────┐  ┌────────┐  ┌───────┐  │
│   │  /auth   │  │ /expenses │  │/budget │  │/admin │  │
│   └──────────┘  └───────────┘  └────────┘  └───────┘  │
│                                                         │
│   Middleware:  auth.js (JWT verify)                     │
│               logActivity.js (activity logging)         │
└──────────────────────────┬──────────────────────────────┘
                           │ Mongoose ODM
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   MONGODB ATLAS (Cloud)                  │
│                                                         │
│   ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐ │
│   │  users   │ │ expenses │ │budgets │ │user_activ. │ │
│   └──────────┘ └──────────┘ └────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Data flow
1. The user interacts with a React page component
2. The component calls a function from `src/api/index.js` (Axios instance)
3. Axios automatically attaches the JWT token from localStorage via an interceptor
4. The request hits the Express backend, which verifies the JWT via `auth.js` middleware
5. The route handler queries MongoDB via Mongoose and returns JSON
6. React updates state with the response, triggering a re-render

### Authentication flow
```
User submits login form
        │
        ▼
POST /api/auth/login
        │
        ▼
bcrypt.compare(password, hash)
        │
     match?
    ┌──┴──┐
   Yes    No ──▶ 401 Unauthorized
    │
    ▼
jwt.sign({ userId, role })
        │
        ▼
JWT returned to client
        │
        ▼
Stored in localStorage
        │
        ▼
Axios interceptor attaches to every request
        │
        ▼
Backend verifies on protected routes
```

---

## How to run locally

### Prerequisites
- Node.js v18 or higher
- A MongoDB Atlas account (or local MongoDB instance)

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

Create a `.env` file inside the `backend/` folder:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

Start the backend:
```bash
node server.js
```

The server runs at `http://localhost:3000`.

### 3. Set up the frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Test accounts
| Role | Email | Password |
|---|---|---|
| Regular user | sam@test.com | test123 |
| Admin | admin@test.com | admin123 |

---

## Feature list

### Authentication & security
- JWT-based registration and login with bcryptjs password hashing
- JWT stored in localStorage, attached via Axios interceptor on every request
- Role-based access control - admin and user roles enforced on both frontend routes and backend middleware
- Protected routes redirect unauthenticated users to login
- Admin users are blocked from accessing user pages and vice versa

### Expenses
- Add, edit, and delete expenses with title, date, category, amount, payment method, and description
- Live search - filters the expense table in real time across title, category, description, and payment method
- Filter by time period - this week, this month, all time
- Sort by newest, oldest, highest amount, lowest amount
- Bulk delete - select multiple expenses with checkboxes and delete in one action
- CSV export - download the currently filtered expense list
- Relative timestamps - "Today", "Yesterday", "3 days ago" for recent entries

### Dashboard
- Personalised greeting based on time of day
- Hero section showing total spent this month
- 4-stat summary bar - transactions, top category, daily average, budget used percentage
- Monthly budget card with progress bar (turns amber at 80%, red at 100%)
- Budget warning banner when over or near the limit
- Recent 6 expenses table with category pills
- Category breakdown sidebar with proportional bars

### Reports
- Bar chart - monthly expenditure across last 3, 6, or 12 months
- Doughnut chart - category breakdown for any selected month
- Category breakdown cards with amounts and percentages
- Charts re-themed for dark mode at the Chart.js config level

### Admin panel
- Users table with name, email, role, join date, expense count
- Per-user profile tab - edit name, email, reset password
- Per-user expenses tab - view all expenses (read-only)
- Activity log - every login, logout, and CRUD action with timestamps
- Create user, promote/demote, delete user
- Dynamic closeable tabs for expenses and profile views

### Profile
- Edit name and email
- Change password with current password verification
- Set or update monthly budget

### UX & design
- Full dark mode with carefully chosen tokens - persisted to localStorage
- Responsive layout with hamburger menu on mobile
- Animated splash screen on first load
- Toast notifications for every action
- Empty states on all pages
- Confirm modals for destructive actions
- Footer with newsletter signup, contact form, social links

---

## Folder structure

```
Vault/
├── backend/                        Express.js REST API
│   ├── middleware/
│   │   ├── auth.js                 JWT protect + adminOnly middleware
│   │   └── logActivity.js          Reusable activity logging helper
│   ├── models/
│   │   ├── User.js                 User schema
│   │   ├── Expense.js              Expense schema
│   │   ├── Budget.js               Budget schema
│   │   └── UserActivity.js         Activity log schema
│   ├── routes/
│   │   ├── auth.js                 Register, login, logout, profile, password
│   │   ├── expenses.js             Full CRUD for expenses
│   │   ├── budget.js               Get and update monthly budget
│   │   └── admin.js                Admin-only routes
│   ├── .env.example                Example environment variables
│   └── server.js                   Express app entry point
│
├── frontend/                       React 19 + Vite SPA
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js            Axios instance with JWT interceptor
│   │   ├── components/
│   │   │   ├── Navbar.jsx          Responsive navigation with hamburger menu
│   │   │   ├── Footer.jsx          Site footer
│   │   │   ├── SplashScreen.jsx    Animated splash screen
│   │   │   └── ToastContainer.jsx  Toast notification display
│   │   ├── context/
│   │   │   └── AuthContext.jsx     Global auth state via React Context
│   │   ├── hooks/
│   │   │   └── useToast.js         Custom hook for toast queue
│   │   ├── pages/
│   │   │   ├── Login.jsx           Login page
│   │   │   ├── Register.jsx        Registration page
│   │   │   ├── Dashboard.jsx       Main dashboard
│   │   │   ├── Expenses.jsx        Expense management
│   │   │   ├── Reports.jsx         Spending visualisation
│   │   │   ├── Admin.jsx           Admin panel
│   │   │   └── Profile.jsx         User profile
│   │   ├── App.jsx                 React Router + route guards
│   │   ├── index.css               Global design system
│   │   └── main.jsx                React entry point
│   └── package.json
│
├── database-export/                Sample database exports
│   ├── users.json
│   ├── expenses.json
│   ├── budgets.json
│   └── user_activity.json
│
├── README.md
└── DOCUMENTATION.md        Technical and design rationale for the project
```

---

## API routes

### Auth (`/api/auth`)
| Method | Route | Description | Auth |
|---|---|---|---|
| POST | /register | Create account, return JWT | None |
| POST | /login | Verify credentials, return JWT | None |
| POST | /logout | Log logout activity | Protected |
| PUT | /profile | Update name and email | Protected |
| PUT | /password | Change password | Protected |

### Expenses (`/api/expenses`)
| Method | Route | Description | Auth |
|---|---|---|---|
| GET | / | Get all expenses for current user | Protected |
| POST | / | Create new expense | Protected |
| PUT | /:id | Update expense by ID | Protected |
| DELETE | /:id | Delete expense by ID | Protected |

### Budget (`/api/budget`)
| Method | Route | Description | Auth |
|---|---|---|---|
| GET | / | Get current user's budget | Protected |
| PUT | / | Set or update monthly budget | Protected |

### Admin (`/api/admin`)
| Method | Route | Description | Auth |
|---|---|---|---|
| GET | /users | Get all users with expense count | Admin |
| POST | /users | Create a new user | Admin |
| PUT | /users/:id | Update user name/email | Admin |
| PUT | /users/:id/role | Promote or demote user | Admin |
| PUT | /users/:id/password | Reset user password | Admin |
| DELETE | /users/:id | Delete user and all their data | Admin |
| GET | /users/:id/expenses | Get all expenses for a user | Admin |
| GET | /activity | Get all activity logs | Admin |

---

## Workload allocation

This was an individual submission. All files were written by Samriddhi Sud.

| Area | Files |
|---|---|
| Backend models | `backend/models/*.js` |
| Backend routes | `backend/routes/*.js` |
| Backend middleware | `backend/middleware/*.js` |
| Backend entry point | `backend/server.js` |
| Frontend pages | `frontend/src/pages/*.jsx` |
| Frontend components | `frontend/src/components/*.jsx` |
| Auth context | `frontend/src/context/AuthContext.jsx` |
| Custom hooks | `frontend/src/hooks/useToast.js` |
| API layer | `frontend/src/api/index.js` |
| Routing | `frontend/src/App.jsx` |
| Global styles | `frontend/src/index.css` |

---

## Challenges overcome

The most time-consuming aspect of the project was building a consistent, polished UI across every page. Getting layouts to align correctly - especially the dashboard stats cards, the budget progress bar, and the admin panel tables - required significant iteration to look right at different screen sizes. Dark mode proved particularly tricky: rather than simply inverting colours, every component needed its own carefully chosen dark-mode token so that contrast, readability, and visual hierarchy were preserved across both themes. Chart.js charts also required extra work to re-theme correctly in dark mode, since their default styles are hardcoded and had to be overridden at the config level. Ensuring the JWT interceptor handled token expiry gracefully without breaking the user experience across page navigations was another non-trivial backend-frontend coordination challenge. Designing the activity logging middleware was also non-trivial - rather than duplicating logging logic across every route, a reusable `logActivity` helper was created that any route could call with a user ID, action type, and detail string. This kept route files clean while ensuring every significant user action was consistently recorded in the database.

## Documentation

A separate `DOCUMENTATION.md` file is included in the root of the repository. It covers the technical and design rationale behind the project — why each technology was chosen, how key features were implemented, and the reasoning behind key architectural decisions.