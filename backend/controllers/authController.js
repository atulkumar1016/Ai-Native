const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validateSignup, validateLogin } = require('../validators/authValidator');

// ─── In-memory hardcoded users (no database needed) ───
const DEMO_USERS = [];

// Pre-hash passwords at startup
const initDemoUsers = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  DEMO_USERS.push(
    {
      _id: 'demo_user_001',
      name: 'John Tester',
      email: 'user@test.com',
      password: hashedPassword,
      role: 'user',
    },
    {
      _id: 'demo_admin_001',
      name: 'System Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
    }
  );
  console.log('✅ Demo users initialized (in-memory, no DB required)');
};

// Initialize on module load
initDemoUsers();

// Helper: try to find user in DB first, fall back to in-memory
const findUserByEmail = async (email) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      const dbUser = await User.findOne({ email });
      if (dbUser) return { source: 'db', user: dbUser };
    }
  } catch (e) {
    // DB not available, fall through to in-memory
  }
  const memUser = DEMO_USERS.find((u) => u.email === email.toLowerCase());
  if (memUser) return { source: 'memory', user: memUser };
  return null;
};

const findUserById = async (id) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      const dbUser = await User.findById(id).select('-password');
      if (dbUser) return dbUser;
    }
  } catch (e) {
    // DB not available
  }
  const memUser = DEMO_USERS.find((u) => u._id === id);
  if (memUser) {
    const { password, ...safeUser } = memUser;
    return safeUser;
  }
  return null;
};

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_token_key_12345', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signupUser = async (req, res, next) => {
  try {
    const { error } = validateSignup(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Try DB first, fall back to in-memory
    let user;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const User = require('../models/User');
        user = await User.create({ name, email, password, role: role || 'user' });
      } else {
        throw new Error('No DB');
      }
    } catch (e) {
      // Create in-memory user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = {
        _id: 'user_' + Date.now(),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'user',
      };
      DEMO_USERS.push(user);
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, password } = req.body;

    const result = await findUserByEmail(email);
    if (!result) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { user } = result;

    // Compare password
    let isMatch = false;
    if (typeof user.matchPassword === 'function') {
      isMatch = await user.matchPassword(password);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (isMatch) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

// Export findUserById for use by authMiddleware
module.exports = {
  signupUser,
  loginUser,
  getCurrentUser,
  findUserById,
};
