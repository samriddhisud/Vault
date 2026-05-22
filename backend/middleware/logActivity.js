const UserActivity = require('../models/UserActivity');

const logActivity = async (userId, action, detail = '') => {
  try {
    await UserActivity.create({ userId, action, detail });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

module.exports = logActivity;
