// Expense.js
// Mongoose schema for an individual expense entry.
// Each expense belongs to one user via the userId reference.

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    // Reference to the User who created this expense
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    // Category is a free string rather than an enum to allow flexibility,
    // but the frontend restricts input to the defined category list
    category: { type: String, required: true },
    description: { type: String },
    paymentMethod: { type: String, default: '' },
    // Amount must be at least $0.01 - enforced at both schema and route level
    amount: { type: Number, required: true, min: 0.01 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);