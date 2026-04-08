require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const expensesRouter = require('./routes/expenses');
const budgetRouter = require('./routes/budget');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/expenses', expensesRouter);
app.use('/api/budget', budgetRouter);

mongoose.connect(process.env.MONGODB_URI)
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