# Vault

Vault is an individual university project developed for **32516 Internet Programming - Assignment 1 - Dynamic Web Interface to a Database System**. It is a single-page expense tracker that helps users record expenses, manage a monthly budget, monitor category-based spending, and explore monthly spending trends over time through a clean and responsive interface.

## Problem the Website Solves

Managing everyday expenses can become difficult when spending records are scattered, uncategorised, or hard to review over time. Vault addresses this by providing a single-page interface where users can add, edit, delete, sort, and filter expenses while also viewing budget usage, category summaries, and monthly spending trends in one place.

## Technical Stack

### Frontend

- HTML
- CSS
- Vanilla JavaScript

### Backend

- Node.js
- Express

### Database

- MongoDB
- Mongoose

### Development Tools

- dotenv
- nodemon

## Application Overview

Vault works as a single-page interface. The application updates data dynamically within the same page rather than navigating across multiple HTML pages. It supports all core CRUD operations on the expense database and aims to provide a smooth workflow with minimal interruption while completing common budgeting tasks.

## Features

- Single-page expense tracker interface
- Save and edit a monthly budget
- Add expenses
- Edit existing expenses
- Delete expenses
- View expenses in a structured table
- Filter expenses by:
  - All
  - This Week
  - This Month
  - Specific Month
- Sort expenses by:
  - Newest First
  - Oldest First
  - Highest Amount
  - Lowest Amount
- View **This Month's Overview** cards for the current month
- View **Spending by Category** summary cards
- View **Spending Trends** with:
  - A bar chart for monthly expenditure trends
  - A pie chart for category breakdown by selected month
- Dark mode toggle
- Intro overlay splash screen
- Floating calculator panel
- Custom delete confirmation modal
- Back-to-top button
- Responsive layout for desktop, tablet, and mobile
- Inline validation for required fields
- Keyboard navigability
- Favicon using the Vault logo
- Icon buttons use `aria-label` attributes
- Logo images include alt text

## Key UI and UX Highlights

- The application behaves like a single-page experience and updates content dynamically
- **This Month's Overview** specifically reflects the current month
- The expense table defaults to **This Month** for more relevant day-to-day use
- A **Specific Month** filter allows historical month-based viewing
- Historical MongoDB data supports both chart rendering and month dropdowns
- Future dates are blocked in the expense date picker
- Expense deletion uses a custom confirmation modal instead of the browser's default confirm dialog
- The floating calculator panel supports quick calculations while entering expense amounts
- Dark mode was styled to stay readable and visually consistent without cluttering the interface
- Vault-branded visual details create a more cohesive interface
- Intro splash screen adds a polished first-load experience
- The interface is responsive across desktop, tablet, and mobile screen sizes

## Accessibility

Basic accessibility considerations were included in Vault to improve usability and support clearer interaction:

- Keyboard support was added for important form actions, including saving the monthly budget and adding or updating expenses using the Enter key
- Icon buttons use `aria-label` attributes so their purpose is clearer for assistive technologies
- Logo images include alt text
- Inline validation provides visible feedback when required fields are incomplete or invalid
- Future dates are restricted in the date input to help prevent invalid entries
- Dark mode was designed with readability and contrast in mind across major interface elements

## CRUD Operations

Vault includes all required CRUD operations on the database:

### Create

- Add a new expense
- Create or save a monthly budget

### Read

- Load and display all expenses
- Load and display the current monthly budget
- Display overview cards, category summaries, and charts using stored data

### Update

- Edit an existing expense
- Update the monthly budget

### Delete

- Delete an existing expense

## Backend Routes Summary

### Expense Routes

- `GET /api/expenses` — return all expenses
- `POST /api/expenses` — create a new expense
- `PUT /api/expenses/:id` — update an existing expense
- `DELETE /api/expenses/:id` — delete an expense

### Budget Routes

- `GET /api/budget` — return the current budget
- `PUT /api/budget` — create or update the current budget

## Validation and Error Handling

### Expense Form Validation

Required fields:

- Title
- Date
- Category
- Amount

Validation rules:

- Amount must be greater than `0`
- Future dates are not allowed
- Inline error styling is shown with helper text

### Monthly Budget Validation

- Budget must be greater than `0`
- Save remains disabled until the value is valid
- Save and Clear remain disbaled until a value is entered

### Basic Error Handling

- Feedback messages are shown if expense or budget data cannot be loaded
- Feedback messages are shown if create, update, or delete actions fail
- The interface does not rely on a blank screen in failure states

## Challenges Overcome

- **Form validation and error handling:** One of the main challenges was building the expense form so it felt clear, polished, and reliable. Getting the validation to work properly across all required fields took a few rounds of testing, as some fields were not showing errors correctly at first. I improved this by reviewing the validation logic field by field, separating the checks more clearly, and making sure the correct error messages and CSS error states were triggered for each input. This made the form more consistent and much easier to use.

- **Designing dark mode for readability:** Dark mode was another challenge because it was not enough to simply invert colours from the light mode version. I had to make sure the interface remained readable, accessible, and visually balanced across cards, forms, tables, charts, and category colours. I explored different palettes, tested multiple combinations, and adjusted colours until the contrast and readability felt right. This helped create a dark mode that was both usable and visually consistent.

- **Improving filtering and sorting for a smoother experience:** Deciding on the filtering system and its layout took careful thought, especially the addition of the **Specific Month** filter. Before this, the interface felt less organised and it was harder to review expenses clearly. Adding structured filters made the data easier to explore and improved the overall flow of the app. The **Sort By** options also strengthened the experience by giving users more control over how they want to view and compare their expense data.

- **Adding a calculator based on usability testing:** During usability testing, I noticed that I was using my phone's calculator before entering an amount in the expense form. That made the process feel interrupted, so I decided to include a floating calculator directly in the interface. It can be opened and closed whenever needed, and the result can be inserted straight into the amount field. This was a small addition, but it made the expense entry flow much smoother and more convenient.

- **Keeping the interface responsive and visually consistent:** Maintaining responsiveness and visual consistency across different screen sizes was also a challenge. I addressed this by testing the layout at desktop, tablet, and mobile widths, then refining spacing, grid behaviour, button placement, and section alignment so the interface stayed clean and usable. I also adjusted how floating and interactive elements behaved on smaller screens to avoid clutter or overlap. This helped keep the overall design polished and consistent across devices.

## Folder Structure

- `models/` — stores the MongoDB schemas for expenses and budget data
- `public/` — contains the frontend files for the single-page interface, including HTML, CSS, JavaScript, and branding assets
- `routes/` — contains the Express route files for budget and expense CRUD operations
- `database-export/` — contains the exported JSON files included for assignment submission
- `server.js` — runs the Express server and connects the frontend, routes, and database

```text
Vault/
├── models/
│   ├── Budget.js
│   └── Expense.js
├── public/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── logo.png
├── routes/
│   ├── budget.js
│   └── expenses.js
├── database-export/
│   ├── budgets.json
│   └── expenses.json
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

## Setup and Installation

To run Vault locally:

1. Download or clone the project folder.
2. Open the project in VS Code or your preferred code editor.
3. Open a terminal in the project folder.
4. Install dependencies:

```bash
npm install
```

5. Create a `.env` file in the root folder using the provided `.env.example` file.
6. Add your MongoDB connection string to the `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string_here
PORT=3000
```

7. Start the application:

```bash
npm start
```

For development with automatic restart, run:

```bash
npm run dev
```

8. Open the browser and go to:

```text
http://localhost:3000
```

Vault will then load in the browser and connect to the MongoDB database using the environment variables provided in the `.env` file.

## Environment Variables

Vault uses environment variables to keep sensitive configuration details separate from the source code.

The `.env.example` file includes the required variables:

```env
MONGODB_URI=your_mongodb_connection_string_here
PORT=3000
```

### Variable Explanation

- `MONGODB_URI` — the MongoDB connection string used to connect the application to the database
- `PORT` — the port number used to run the local Express server

## Submission Contents

The final submission includes:

- Full project source code
- Frontend files in the `public/` folder
- Backend route files in the `routes/` folder
- MongoDB schema files in the `models/` folder
- `server.js`
- `package.json` and `package-lock.json`
- `.env.example`
- `README.md`
- `database-export/expenses.json`
- `database-export/budgets.json`

The `database-export` folder is included to provide the exported budget and expense data used for the project submission.

## Database Export Note

A database export is included in the `database-export/` folder as part of the assignment submission. These JSON files contain the stored expense and budget data used for the project and help demonstrate the database structure and historical records used by the application.

## Author

**Samriddhi Sud**  
Student Number: 25741149