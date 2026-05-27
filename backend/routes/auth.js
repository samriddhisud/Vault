// auth.js
// Handles all authentication routes: register, login, logout,
// update profile, and change password.

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logActivity = require('../middleware/logActivity');

// Generates a signed JWT token containing the user's ID.
// The token expires after 7 days so users stay logged in across sessions.
// The secret key is stored in .env and never committed to the repository.
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
// Creates a new user account. Validates input, checks for duplicate emails,
// hashes the password with bcrypt before storing, then returns a JWT so the
// user is automatically logged in without a separate login step.
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // Check for duplicate email before creating the user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Hash the password with a salt factor of 10 before storing.
    // The plain text password is never written to the database.
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    // Log the registration event to the activity feed
    await logActivity(user._id, 'register', `${name} created an account`);

    // Return user data and JWT - the frontend stores this and sends
    // the token on every subsequent request via the Axios interceptor
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

// POST /api/auth/login
// Verifies credentials and returns a JWT on success.
// Both "user not found" and "wrong password" return the same 401 error message
// to avoid leaking information about which emails are registered.
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

    // bcrypt.compare hashes the submitted password and compares it to the stored hash.
    // This is secure because the original password cannot be recovered from the hash.
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

// Note: module.exports is called here but routes below still work because
// Express adds them to the router object before it is exported.
module.exports = router;

// PUT /api/auth/profile (protected)
// Updates the logged-in user's name and email.
// Checks that the new email is not already taken by another account
// using $ne (not equal) to exclude the current user from the duplicate check.
router.put('/profile', require('../middleware/auth').protect, async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });
  try {
    const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existing) return res.status(400).json({ error: 'Email already in use.' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true } // return the updated document, not the original
    ).select('-passwordHash'); // never return the password hash to the client
    res.status(200).json(user);
  } catch {
    res.status(500).json({ error: 'Could not update profile.' });
  }
});

// PUT /api/auth/password (protected)
// Changes the logged-in user's password.
// Requires the current password to verify identity before allowing the change.
router.put('/password', require('../middleware/auth').protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords are required.' });
  try {
    const user = await User.findById(req.user._id);
    // Verify the current password before allowing the change
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect.' });
    // Hash and store the new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: 'Password updated.' });
  } catch {
    res.status(500).json({ error: 'Could not update password.' });
  }
});

// POST /api/auth/logout (protected)
// Logs the logout event in the activity feed.
// JWT is stateless so there is no server-side session to invalidate -
// the client handles logout by deleting the token from localStorage.
router.post('/logout', require('../middleware/auth').protect, async (req, res) => {
  try {
    await logActivity(req.user._id, 'logout', `${req.user.name} logged out`);
    res.status(200).json({ message: 'Logged out.' });
  } catch {
    res.status(500).json({ error: 'Could not log logout.' });
  }
});