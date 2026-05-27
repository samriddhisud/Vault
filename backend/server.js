// server.js
// Entry point for the Express backend.
// Loads environment variables, sets up middleware, mounts route handlers,
// and connects to MongoDB before starting the server.
// The server only starts listening after a successful database connection
// to ensure no requests are handled before the database is ready.

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRouter = require('./routes/auth');
const expensesRouter = require('./routes/expenses');
const budgetRouter = require('./routes/budget');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow requests from the Vite dev server.
// credentials: true is required for cookies and Authorization headers to work cross-origin.
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Parse incoming JSON request bodies so route handlers can access req.body
app.use(express.json());

// Mount route handlers under their respective API prefixes
app.use('/api/auth', authRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/admin', adminRouter);

// Connect to MongoDB Atlas first, then start the HTTP server.
// process.exit(1) on connection failure ensures the app doesn't run
// in a broken state if the database is unavailable.
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });