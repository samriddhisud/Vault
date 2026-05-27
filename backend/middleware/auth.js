// auth.js (middleware)
// Provides two middleware functions used to protect backend routes:
// - protect: verifies the JWT and attaches the user to req.user
// - adminOnly: checks that the logged-in user has the admin role

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// protect middleware - verifies the JWT token on every protected request.
// The token is expected in the Authorization header as "Bearer <token>".
// The Axios interceptor in the frontend attaches it automatically.
// On success, req.user is populated with the user's data so route handlers
// can access it without making an extra database query.
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Reject requests with no token or wrong format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorised. No token provided.' });
  }

  // Extract the token from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token signature against the secret key.
    // If the token has been tampered with or has expired, this throws an error.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the database to ensure they still exist.
    // passwordHash is excluded so it is never accidentally exposed downstream.
    req.user = await User.findById(decoded.id).select('-passwordHash');

    if (!req.user) {
      return res.status(401).json({ error: 'Not authorised. User not found.' });
    }

    // Pass control to the next middleware or route handler
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorised. Invalid token.' });
  }
};

// adminOnly middleware - must be used after protect so req.user is available.
// Returns 403 Forbidden (not 401 Unauthorized) because the user is authenticated
// but does not have permission to access the resource.
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admins only.' });
  }
};

module.exports = { protect, adminOnly };