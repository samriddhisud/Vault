const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

// GET /api/budget - fetch the current budget
router.get('/', async (req, res) => {
  try {
    const budget = await Budget.findOne();
    res.status(200).json(budget || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch budget.' });
  }
});

// PUT /api/budget - create or update the budget
router.put('/', async (req, res) => {
  const { monthlyBudget } = req.body;

  if (monthlyBudget === undefined) {
    return res.status(400).json({ error: 'monthlyBudget is required.' });
  }

  if (monthlyBudget <= 0) {
    return res.status(400).json({ error: 'monthlyBudget must be greater than 0.' });
  }

  try {
    const existingBudget = await Budget.findOne();

    if (existingBudget) {
      existingBudget.monthlyBudget = monthlyBudget;
      const updatedBudget = await existingBudget.save();
      return res.status(200).json(updatedBudget);
    }

    const newBudget = new Budget({ monthlyBudget });
    const savedBudget = await newBudget.save();
    return res.status(201).json(savedBudget);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not save budget.' });
  }
});

module.exports = router;