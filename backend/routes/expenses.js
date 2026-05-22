const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const logActivity = require('../middleware/logActivity');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch expenses.' });
  }
});

router.post('/', async (req, res) => {
  const { title, date, category, paymentMethod, amount, description } = req.body;

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

    await logActivity(req.user._id, 'add_expense', title);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not create expense.' });
  }
});

router.put('/:id', async (req, res) => {
  const { title, date, category, paymentMethod, amount, description } = req.body;

  if (!title || !date || !category || amount === undefined) {
    return res.status(400).json({ error: 'title, date, category, and amount are required.' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'amount must be greater than 0.' });
  }

  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });

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

router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });

    await Expense.findByIdAndDelete(req.params.id);
    await logActivity(req.user._id, 'delete_expense', expense.title);

    res.status(200).json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not delete expense.' });
  }
});

module.exports = router;
