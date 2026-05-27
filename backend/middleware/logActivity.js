// logActivity.js (middleware)
// A reusable helper function for logging user actions to the database.
// Rather than duplicating activity logging code in every route, any route
// can call logActivity(userId, action, detail) in a single line.
// Errors are caught silently so a logging failure never breaks the main request.

const UserActivity = require('../models/UserActivity');

// Logs a user action to the UserActivity collection.
// userId  - the ID of the user who performed the action
// action  - a short string key e.g. 'login', 'add_expense', 'delete_expense'
// detail  - optional human-readable description e.g. the expense title
const logActivity = async (userId, action, detail = '') => {
  try {
    await UserActivity.create({ userId, action, detail });
  } catch (err) {
    // Log the error to the server console but do not throw it.
    // This ensures a logging failure never causes the parent request to fail.
    console.error('Activity log error:', err.message);
  }
};

module.exports = logActivity;