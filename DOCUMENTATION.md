# Vault - Technical Documentation

This document explains the technical and design decisions behind Vault. It covers why specific technologies were chosen, how key features were implemented, and the reasoning behind architectural choices. It is written for both technical readers (developers, markers) and non-technical readers who want to understand the thinking behind the project.

---

## Table of contents

1. [Why these technologies?](#1-why-these-technologies)
2. [Application architecture](#2-application-architecture)
3. [Authentication design](#3-authentication-design)
4. [Frontend design decisions](#4-frontend-design-decisions)
5. [State management rationale](#5-state-management-rationale)
6. [Key feature implementations](#6-key-feature-implementations)
7. [Database design](#7-database-design)
8. [Security considerations](#8-security-considerations)
9. [UI and design system](#9-ui-and-design-system)

---

## 1. Why these technologies?

### React 19 (Frontend)
React was chosen over vanilla JavaScript because the application has many pieces of UI that share and react to the same data. For example, when a user adds an expense, the dashboard total, the recent expenses table, and the category breakdown sidebar all need to update simultaneously. In vanilla JS this would require manually finding and updating each DOM element - error-prone and hard to maintain. React's component model and state system handle this automatically: update the state, and every component that depends on it re-renders.

Vite was chosen over Create React App because it starts up instantly and updates the browser in milliseconds when code changes, making development much faster.

### Node.js + Express (Backend)
Node.js was a natural choice because the frontend is already JavaScript, meaning the same language is used across the entire stack. This reduces context-switching and makes it easier to share patterns and logic. Express was chosen over alternatives like FastAPI (Python) or Django because it is minimal and unopinionated - it does exactly what you tell it to, without forcing a particular project structure. This made it easy to design the API exactly as needed.

### MongoDB Atlas (Database)
MongoDB was chosen over a relational database like MySQL for several reasons:

- **Schema flexibility** - expense items and user activity logs have varying fields. MongoDB's document model accommodates this without requiring migrations.
- **JSON native** - since the backend is Node.js and the frontend is React, data flows as JSON throughout the entire stack. MongoDB stores documents as BSON (binary JSON), so there is no translation layer needed.
- **Atlas cloud hosting** - MongoDB Atlas provides a free-tier cloud database, meaning the app works from any machine without needing a local database installation.

### JWT (Authentication)
JSON Web Tokens were chosen over session-based authentication because they are stateless - the server does not need to store session data. The token is issued on login, stored on the client, and sent with every request. The server verifies it by checking the signature against the secret key. This is appropriate for a REST API where each request should be self-contained.

### Custom CSS (Styling)
No CSS framework like Tailwind or Bootstrap was used. Instead, a custom CSS design system was built using CSS variables (design tokens). This was a deliberate choice to have full control over the visual language - spacing, colours, border radii, shadows - without fighting against a framework's defaults. It also means the bundle size is smaller, since no unused utility classes are shipped.

---

## 2. Application architecture

Vault follows a three-tier architecture:

**Tier 1 - Presentation (React SPA)**
The React app is a single-page application. There is only one HTML file (`index.html`). React Router handles navigation by swapping components in and out of the DOM without ever reloading the page. This gives the app a fast, native-app feel.

**Tier 2 - Application logic (Express REST API)**
The backend is a REST API that exposes endpoints for authentication, expense management, budget management, and admin operations. It is completely decoupled from the frontend - it does not know or care that the client is a React app. It simply receives HTTP requests, processes them, and returns JSON responses.

**Tier 3 - Data (MongoDB Atlas)**
The database stores all persistent data. Mongoose is used as an ODM (Object Document Mapper), which provides schema validation and a clean API for querying MongoDB from Node.js.

### Why decouple the frontend and backend?
Decoupling means the frontend and backend can be developed, deployed, and scaled independently. The React app communicates with the backend exclusively via the REST API. If the backend needed to be rewritten in a different language, the frontend would not need to change at all, as long as the API contract stayed the same.

---

## 3. Authentication design

### Password hashing
User passwords are never stored in plain text. When a user registers, `bcryptjs` hashes the password with a salt factor of 10 before storing it in the database. When they log in, `bcrypt.compare()` checks the submitted password against the stored hash. Even if the database were compromised, the original passwords could not be recovered.

### JWT token flow
1. On successful login, the server creates a JWT containing `{ userId, role }` signed with a secret key
2. The token is returned to the client and stored in `localStorage`
3. The Axios instance in `src/api/index.js` has a request interceptor that reads the token from localStorage and attaches it as an `Authorization: Bearer <token>` header on every outgoing request
4. Every protected route on the backend passes through the `auth.js` middleware, which verifies the token's signature and extracts the user's ID and role
5. If the token is missing or invalid, the middleware returns `401 Unauthorized`

### Role-based access control
Two roles exist: `user` and `admin`. Role-based access is enforced at two levels:

- **Backend** - the `adminOnly` middleware checks that `req.user.role === 'admin'` before allowing access to admin routes
- **Frontend** - `AdminRoute` and `UserRoute` components in `App.jsx` check the user's role from React Context and redirect if the role does not match the route's requirement

This dual enforcement means a malicious user cannot access admin data even if they somehow bypass the frontend routing, because the backend will reject any request without a valid admin token.

---

## 4. Frontend design decisions

### React Context for auth state
The logged-in user's data (name, email, role) is stored in React Context (`AuthContext`). This means any component anywhere in the tree can access the current user without prop drilling. The context also provides `login()` and `logout()` functions that update both the context state and localStorage in one call.

### Axios instance with interceptor
Rather than importing `axios` directly in every component and manually adding headers, a single Axios instance is created in `src/api/index.js` with:
- A `baseURL` pointing to the backend
- A request interceptor that automatically attaches the JWT

This means all API calls across the entire app share the same configuration. If the backend URL changes, it only needs to be updated in one place.

### Route guards
Three route wrapper components are used in `App.jsx`:

- `ProtectedRoute` - redirects to `/login` if no user is logged in
- `AdminRoute` - redirects non-admins to `/dashboard`
- `UserRoute` - redirects admins to `/admin` (admins cannot access user pages)

This prevents users from accidentally or deliberately navigating to pages they should not see.

### useRef to prevent double chart render
React 19 in development mode runs effects twice to help detect side effects. Since Chart.js attaches a chart instance to a canvas element, running the effect twice would create two overlapping charts. This was fixed by using a `useRef` flag (`initialized.current`) that prevents the data-fetching `useEffect` from running more than once per mount.

---

## 5. State management rationale

### Why useState and not useReducer or Redux?
Each page component manages its own local state with `useState`. A global state manager like Redux was not used because the app's state is not deeply shared across many unrelated components. The main shared state is the authenticated user, which is handled by React Context. Everything else - expense lists, form values, loading states - is local to the component that needs it.

`useReducer` would be appropriate if a component had many related state transitions (like a complex form wizard), but most components in Vault have straightforward state (loading, data, error) that `useState` handles cleanly.

### Why not React Query or SWR?
These data-fetching libraries provide caching, background refetching, and loading states automatically. They were not used because the added complexity was not warranted for this project's scope. Manual `useEffect` + `useState` data fetching is explicit and easy to follow, which is better for a project where code readability is being assessed.

---

## 6. Key feature implementations

### Live search
The live search on the Expenses page uses `useMemo` to compute the filtered expense list. `useMemo` recalculates only when its dependencies (the expense array, search query, filter period, or sort order) change. This is more efficient than filtering inside the render function, which would recompute on every render regardless of whether the data changed.

```js
const filtered = useMemo(() => {
  // filter and sort logic
}, [expenses, search, filterPeriod, sortBy])
```

### Budget progress bar
The budget percentage is calculated as `Math.round((totalSpent / budget.monthlyBudget) * 100)`. The progress bar width is set to `Math.min(budgetPct, 100)%` so it never overflows its container even when spending exceeds 100%. The CSS class changes at 80% (warning/amber) and 100% (danger/red) to give the user visual feedback about their spending level.

### Activity logging
Rather than adding logging code to every route individually, a reusable `logActivity` helper function was created in `backend/middleware/logActivity.js`. Any route can call it with a user ID, action string, and detail string. The function creates a `UserActivity` document in the database. This keeps route files clean and ensures consistent logging across the entire application.

### Bulk delete
The bulk delete feature works by maintaining a `selected` array in state containing the IDs of checked expenses. When the user confirms deletion, `Promise.all()` fires a DELETE request for each selected ID in parallel, then reloads the expense list. Using `Promise.all` rather than sequential `await` calls means all deletions happen simultaneously, making the operation much faster for large selections.

### Dark mode
Dark mode is implemented entirely with CSS variables. The root `:root` selector defines light-mode token values. The `body.dark` selector overrides them with dark-mode values. When the user toggles dark mode, the `dark` class is added to `document.body`. All components use `var(--token-name)` for colours, so they automatically switch. The preference is persisted to `localStorage` so it survives page refreshes.

---

## 7. Database design

### Collections

**users**
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "passwordHash": "string",
  "role": "user | admin",
  "createdAt": "Date"
}
```

**expenses**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "title": "string",
  "date": "Date",
  "category": "Food | Transport | Shopping | Bills | Entertainment | Health | Other",
  "amount": "number",
  "paymentMethod": "string",
  "description": "string",
  "createdAt": "Date"
}
```

**budgets**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User, unique)",
  "monthlyBudget": "number"
}
```

**useractivities**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "action": "login | logout | register | add_expense | edit_expense | delete_expense | update_budget",
  "detail": "string",
  "createdAt": "Date"
}
```

### Why no foreign key constraints?
MongoDB does not enforce referential integrity like a relational database. Instead, Mongoose `populate()` is used to join related documents when needed (e.g. populating `userId` on activity logs to get the user's name). When a user is deleted, their associated expenses, budget, and activity logs are deleted manually in the admin delete route to maintain data consistency.

---

## 8. Security considerations

- **Passwords** - hashed with bcrypt, never stored or logged in plain text
- **JWT secret** - stored in `.env`, never committed to the repository (`.env` is in `.gitignore`)
- **Protected routes** - every backend route that accesses user data verifies the JWT and checks that the requesting user owns the resource (or is an admin)
- **Input validation** - all form inputs are validated on both the frontend (before submission) and the backend (before database operations)
- **Role separation** - admins cannot access their own user dashboard pages; users cannot access admin routes
- **No sensitive data in tokens** - the JWT payload contains only `userId` and `role`, never passwords or email addresses

---

## 9. UI and design system

### Design tokens
All visual values - colours, spacing, border radii, shadows, font sizes - are defined as CSS custom properties (variables) in `:root`. This means the entire visual language of the app can be changed by editing a single block of CSS. It also makes dark mode trivial to implement: override the tokens in `body.dark` and every component updates automatically.

### No UI framework
Tailwind, Bootstrap, and Material UI were all considered and rejected. Using a framework would have produced a generic-looking interface that resembles thousands of other apps. Building a custom design system from scratch allowed full control over the visual identity - the bold black borders, chunky pill buttons, cream backgrounds, and lime green accents that give Vault its distinctive look.

### Component-level CSS classes
Rather than using inline styles for everything, reusable CSS classes like `.card`, `.btn`, `.badge`, `.cat-pill`, `.table-wrap`, and `.modal` are defined in `index.css`. Components apply these classes for consistent styling without duplication. Inline styles are only used for dynamic values (like a progress bar width percentage) that cannot be expressed as static CSS.

### Responsive design
The layout is responsive without using a CSS grid framework. CSS Grid and Flexbox handle layout at each breakpoint. Three breakpoints are used:
- `>1024px` - full desktop layout with sidebar
- `769px–1024px` - tablet layout with stacked grid
- `<768px` - mobile layout with hamburger menu