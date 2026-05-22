const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logActivity = require('../middleware/logActivity');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    await logActivity(user._id, 'register', `${name} created an account`);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not register.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await logActivity(user._id, 'login', `${user.name} logged in`);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Could not log in.' });
  }
});

module.exports = router;

router.put('/profile', require('../middleware/auth').protect, async (req, res) => {
  const { name, email } = req.body
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' })
  try {
    const existing = await User.findOne({ email, _id: { $ne: req.user._id } })
    if (existing) return res.status(400).json({ error: 'Email already in use.' })
    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true }).select('-passwordHash')
    res.status(200).json(user)
  } catch {
    res.status(500).json({ error: 'Could not update profile.' })
  }
})

router.put('/password', require('../middleware/auth').protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords are required.' })
  try {
    const user = await User.findById(req.user._id)
    const isMatch = await require('bcryptjs').compare(currentPassword, user.passwordHash)
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect.' })
    user.passwordHash = await require('bcryptjs').hash(newPassword, 10)
    await user.save()
    res.status(200).json({ message: 'Password updated.' })
  } catch {
    res.status(500).json({ error: 'Could not update password.' })
  }
})
