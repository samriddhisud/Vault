const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');
const logActivity = require('../middleware/logActivity');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const budget = await Budget.findOne({ userId: req.user._id });
    res.status(200).json(budget || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch budget.' });
  }
});

router.put('/', async (req, res) => {
  const { monthlyBudget } = req.body;

  if (monthlyBudget === undefined) {
    return res.status(400).json({ error: 'monthlyBudget is required.' });
  }

  if (monthlyBudget <= 0) {
    return res.status(400).json({ error: 'monthlyBudget must be greater than 0.' });
  }

  try {
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id },
      { monthlyBudget },
      { new: true, upsert: true, runValidators: true }
    );

    await logActivity(req.user._id, 'update_budget', `Set to $${monthlyBudget}`);
    res.status(200).json(budget);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not save budget.' });
  }
});

module.exports = router;
