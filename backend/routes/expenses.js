// expenses.js
// CRUD routes for expense management.
// All routes are protected - only the logged-in user can access their own expenses.

const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const logActivity = require('../middleware/logActivity');

// Apply the protect middleware to all routes in this file.
// This means every request must include a valid JWT token.
// req.user is set by the protect middleware and contains the logged-in user's data.
router.use(protect);

// GET /api/expenses
// Returns all expenses belonging to the logged-in user, sorted newest first.
// userId filter ensures users can only see their own expenses, not anyone else's.
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch expenses.' });
  }
});

// POST /api/expenses
// Creates a new expense for the logged-in user.
// userId is taken from the JWT token, not from the request body,
// so a user cannot create expenses on behalf of another user.
router.post('/', async (req, res) => {
  const { title, date, category, paymentMethod, amount, description } = req.body;

  // Server-side validation as a second line of defence after client-side checks
  if (!title || !date || !category || amount === undefined) {
    return res.status(400).json({ error: 'title, date, category, and amount are required.' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'amount must be greater than 0.' });
  }

  try {
    const expense = await Expense.create({
      userId: req.user._id,
      title, date, category, paymentMethod, amount, description,
    });

    // Log the action so it appears in the admin activity feed
    await logActivity(req.user._id, 'add_expense', title);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not create expense.' });
  }
});

// PUT /api/expenses/:id
// Updates an existing expense by ID.
// Verifies ownership by checking both _id and userId match before updating,
// preventing one user from editing another user's expenses.
router.put('/:id', async (req, res) => {
  const { title, date, category, paymentMethod, amount, description } = req.body;

  if (!title || !date || !category || amount === undefined) {
    return res.status(400).json({ error: 'title, date, category, and amount are required.' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'amount must be greater than 0.' });
  }

  try {
    // First check that this expense belongs to the logged-in user
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });

    // { new: true } returns the updated document instead of the original
    // runValidators ensures Mongoose schema validators run on the updated fields
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { title, date, category, paymentMethod, amount, description },
      { new: true, runValidators: true }
    );

    await logActivity(req.user._id, 'edit_expense', title);
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not update expense.' });
  }
});

// DELETE /api/expenses/:id
// Deletes an expense by ID.
// Same ownership check as the PUT route - userId must match the logged-in user.
// The expense title is saved before deletion so it can be logged in the activity feed.
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });

    await Expense.findByIdAndDelete(req.params.id);
    // Log using the saved title since the expense no longer exists after deletion
    await logActivity(req.user._id, 'delete_expense', expense.title);

    res.status(200).json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not delete expense.' });
  }
});

module.exports = router;