const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    monthlyBudget: { type: Number, required: true, min: 0.01 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Budget', budgetSchema);