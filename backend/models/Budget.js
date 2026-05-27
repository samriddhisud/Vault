// Budget.js
// Mongoose schema for a user's monthly budget.
// unique: true on userId ensures each user can only have one budget document.
// The upsert option in the budget route creates or updates this document as needed.

const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    // Reference to the User who owns this budget
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // The monthly spending limit in dollars - must be at least $0.01
    monthlyBudget: { type: Number, required: true, min: 0.01 },
  },
  // timestamps: true automatically adds createdAt and updatedAt fields
  { timestamps: true }
);

module.exports = mongoose.model('Budget', budgetSchema);