// admin.js
// Admin-only routes for user management, activity logs, and role control.
// All routes are protected by both the JWT auth middleware and the adminOnly middleware,
// so only users with role: 'admin' can access anything in this file.

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Expense = require('../models/Expense');
const UserActivity = require('../models/UserActivity');
const { protect, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Apply both protect (JWT check) and adminOnly (role check) to every route
router.use(protect, adminOnly);

// GET /api/admin/users
// Returns all users with their expense count.
// passwordHash is excluded from the response using .select('-passwordHash').
// Promise.all runs all countDocuments queries in parallel for performance.
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    const usersWithCount = await Promise.all(
      users.map(async (user) => {
        const expenseCount = await Expense.countDocuments({ userId: user._id });
        return { ...user.toObject(), expenseCount };
      })
    );
    res.status(200).json(usersWithCount);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch users.' });
  }
});

// GET /api/admin/users/:id/expenses
// Returns a specific user's profile and all their expenses.
// Used by the admin panel to populate the expenses tab for a user.
router.get('/users/:id/expenses', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const expenses = await Expense.find({ userId: req.params.id }).sort({ date: -1 });
    res.status(200).json({ user, expenses });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch user expenses.' });
  }
});

// GET /api/admin/activity
// Returns the 100 most recent activity logs across all users.
// populate('userId', 'name email') joins the user document so the activity
// log shows the user's name instead of just their ID.
router.get('/activity', async (req, res) => {
  try {
    const logs = await UserActivity.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch activity logs.' });
  }
});

// GET /api/admin/activity/:userId
// Returns activity logs for a specific user only
router.get('/activity/:userId', async (req, res) => {
  try {
    const logs = await UserActivity.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch activity.' });
  }
});

// POST /api/admin/users
// Creates a new user account from the admin panel.
// The password is hashed before storing, same as the register route.
// passwordHash is deleted from the response before sending to the client.
router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: role || 'user' });
    // Spread and delete passwordHash so it is never returned to the client
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.status(201).json(userObj);
  } catch {
    res.status(500).json({ error: 'Could not create user.' });
  }
});

// PUT /api/admin/users/:id/role
// Promotes or demotes a user between 'user' and 'admin' roles.
// Only accepts the two valid role values to prevent invalid data.
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Role must be user or admin.' });
  }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not update role.' });
  }
});

// PUT /api/admin/users/:id
// Updates a user's name and email from the admin profile tab.
// $ne (not equal) excludes the current user from the duplicate email check
// so an admin can save without changing the email.
router.put('/users/:id', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });
  try {
    const existing = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ error: 'Email already in use.' });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json(user);
  } catch {
    res.status(500).json({ error: 'Could not update user.' });
  }
});

// PUT /api/admin/users/:id/password
// Resets a user's password from the admin profile tab.
// Does not require the current password since admins have elevated privileges.
router.put('/users/:id/password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: 'Password updated.' });
  } catch {
    res.status(500).json({ error: 'Could not update password.' });
  }
});

// DELETE /api/admin/users/:id
// Deletes a user and all their associated data (expenses and activity logs).
// Prevents admins from deleting their own account to avoid lockout.
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    // Prevent the logged-in admin from deleting their own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    // Delete all data associated with this user before deleting the user
    await Expense.deleteMany({ userId: req.params.id });
    await UserActivity.deleteMany({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User and all their data deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not delete user.' });
  }
});

// PUT /api/admin/expenses/:id
// Allows admin to edit any user's expense directly
router.put('/expenses/:id', async (req, res) => {
  const { title, date, category, paymentMethod, amount, description } = req.body;
  if (!title || !date || !category || amount === undefined) {
    return res.status(400).json({ error: 'title, date, category, and amount are required.' });
  }
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { title, date, category, paymentMethod, amount, description },
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    res.status(200).json(expense);
  } catch {
    res.status(500).json({ error: 'Could not update expense.' });
  }
});

// DELETE /api/admin/expenses/:id
// Allows admin to delete any user's expense directly
router.delete('/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    res.status(200).json({ message: 'Expense deleted.' });
  } catch {
    res.status(500).json({ error: 'Could not delete expense.' });
  }
});

module.exports = router;