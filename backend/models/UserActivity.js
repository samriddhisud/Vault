// UserActivity.js
// Mongoose schema for activity log entries.
// A new document is created every time a user performs a significant action
// such as logging in, adding an expense, or updating their budget.

const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    // Reference to the User who performed the action
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Short action key e.g. 'login', 'add_expense', 'delete_expense'
    action: { type: String, required: true },
    // Human-readable detail e.g. the expense title or "Set to $2000"
    detail: { type: String, default: '' },
  },
  // createdAt from timestamps is used as the activity timestamp in the admin panel
  { timestamps: true }
);

module.exports = mongoose.model('UserActivity', userActivitySchema);