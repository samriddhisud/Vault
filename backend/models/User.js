// User.js
// Mongoose schema for a user account.
// Passwords are never stored in plain text - only the bcrypt hash is saved.

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // unique: true enforces one account per email address at the database level
    // lowercase: true normalises emails so "User@Example.com" and "user@example.com" are treated the same
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // The bcrypt hash of the user's password - the original password is never stored
    passwordHash: { type: String, required: true },
    // Role controls access - 'user' sees their own data, 'admin' can manage all users
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);