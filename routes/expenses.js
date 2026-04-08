const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// GET /api/expenses - fetch all expenses, newest first
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch expenses.' });
  }
});

// POST /api/expenses - create a new expense
router.post('/', async (req, res) => {
  const { title, date, category, paymentMethod, amount, description } = req.body;

  if (!title || !date || !category || amount === undefined) {
  return res.status(400).json({
    error: 'title, date, category, and amount are required.'
  });
 } 

  if (amount <= 0) {
    return res.status(400).json({ error: 'amount must be greater than 0.' });
  }

  try {
    const expense = new Expense({
      title,
      date,
      category,
      paymentMethod,
      amount,
      description
    });

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not create expense.' });
  }
});

// PUT /api/expenses/:id - update an existing expense
router.put('/:id', async (req, res) => {
  const { title, date, category, paymentMethod, amount, description } = req.body;

  if (!title || !date || !category || amount === undefined) {
  return res.status(400).json({
    error: 'title, date, category, and amount are required.'
  });
 }

  if (amount <= 0) {
    return res.status(400).json({ error: 'amount must be greater than 0.' });
  }

  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title,
        date,
        category,
        paymentMethod,
        amount,
        description
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedExpense) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    res.status(200).json(updatedExpense);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not update expense.' });
  }
});

// DELETE /api/expenses/:id - delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);

    if (!deletedExpense) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    res.status(200).json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not delete expense.' });
  }
});

module.exports = router;