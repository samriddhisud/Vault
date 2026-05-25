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

// POST /api/admin/users - create a new user from admin panel
router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' })
  }
  try {
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ error: 'Email already in use.' })
    const bcrypt = require('bcryptjs')
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash, role: role || 'user' })
    res.status(201).json({ ...user.toObject(), passwordHash: undefined })
  } catch {
    res.status(500).json({ error: 'Could not create user.' })
  }
})

// POST /api/admin/users - create a new user from admin panel
router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' })
  }
  try {
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ error: 'Email already in use.' })
    const bcrypt = require('bcryptjs')
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash, role: role || 'user' })
    res.status(201).json({ ...user.toObject(), passwordHash: undefined })
  } catch {
    res.status(500).json({ error: 'Could not create user.' })
  }
})

// PUT /api/admin/users/:id - update a user's profile
router.put('/users/:id', async (req, res) => {
  const { name, email } = req.body
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' })
  try {
    const existing = await User.findOne({ email, _id: { $ne: req.params.id } })
    if (existing) return res.status(400).json({ error: 'Email already in use.' })
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    ).select('-passwordHash')
    if (!user) return res.status(404).json({ error: 'User not found.' })
    res.status(200).json(user)
  } catch {
    res.status(500).json({ error: 'Could not update user.' })
  }
})

// PUT /api/admin/expenses/:id - edit any user's expense
router.put('/expenses/:id', async (req, res) => {
  const { title, date, category, paymentMethod, amount, description } = req.body
  if (!title || !date || !category || amount === undefined) {
    return res.status(400).json({ error: 'title, date, category, and amount are required.' })
  }
  try {
    const expense = await require('../models/Expense').findByIdAndUpdate(
      req.params.id,
      { title, date, category, paymentMethod, amount, description },
      { new: true, runValidators: true }
    )
    if (!expense) return res.status(404).json({ error: 'Expense not found.' })
    res.status(200).json(expense)
  } catch {
    res.status(500).json({ error: 'Could not update expense.' })
  }
})

// DELETE /api/admin/expenses/:id - delete any user's expense
router.delete('/expenses/:id', async (req, res) => {
  try {
    const expense = await require('../models/Expense').findByIdAndDelete(req.params.id)
    if (!expense) return res.status(404).json({ error: 'Expense not found.' })
    res.status(200).json({ message: 'Expense deleted.' })
  } catch {
    res.status(500).json({ error: 'Could not delete expense.' })
  }
})

// PUT /api/admin/users/:id/password - reset a user's password
router.put('/users/:id/password', async (req, res) => {
  const { newPassword } = req.body
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }
  try {
    const bcrypt = require('bcryptjs')
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    user.passwordHash = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.status(200).json({ message: 'Password updated.' })
  } catch {
    res.status(500).json({ error: 'Could not update password.' })
  }
})
