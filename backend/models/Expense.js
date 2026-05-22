const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    category: { type: String, required: true },
    description: { type: String },
    paymentMethod: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0.01 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
