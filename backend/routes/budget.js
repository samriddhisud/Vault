// budget.js
// Routes for getting and updating the logged-in user's monthly budget.
// Each user has at most one budget document in the database.

const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');
const logActivity = require('../middleware/logActivity');

// Apply the protect middleware to all routes in this file
router.use(protect);

// GET /api/budget
// Returns the logged-in user's budget document, or null if none has been set yet.
// The frontend uses null to show a "Set budget" prompt instead of a progress bar.
router.get('/', async (req, res) => {
  try {
    const budget = await Budget.findOne({ userId: req.user._id });
    res.status(200).json(budget || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch budget.' });
  }
});

// PUT /api/budget
// Creates or updates the user's monthly budget.
// upsert: true means if no budget document exists for this user, one is created.
// This avoids needing a separate POST route for first-time budget creation.
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
      {
        new: true,        // return the updated document not the original
        upsert: true,     // create the document if it does not exist
        runValidators: true
      }
    );

    await logActivity(req.user._id, 'update_budget', `Set to $${monthlyBudget}`);
    res.status(200).json(budget);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not save budget.' });
  }
});

module.exports = router;