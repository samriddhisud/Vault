const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Expense = require('../models/Expense');
const UserActivity = require('../models/UserActivity');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

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

router.get('/activity/:userId', async (req, res) => {
  try {
    const logs = await UserActivity.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not fetch activity.' });
  }
});

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

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    await Expense.deleteMany({ userId: req.params.id });
    await UserActivity.deleteMany({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User and all their data deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not delete user.' });
  }
});

module.exports = router;
