import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { memoryDb, isDbConnected, generateId, saveDb } from '../config/inMemoryDB.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_collabdocs_key_12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { name, email, password, avatar } = req.body;

  try {
    const userAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    // Database Connected Mode
    if (isDbConnected()) {
      const userExists = await User.findOne({ email });

      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create({
        name,
        email,
        password,
        avatar: userAvatar,
      });

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    }

    // In-Memory Fallback Mode
    const userExists = memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      return res.status(400).json({ message: 'User already exists (In-Memory Database)' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const mockUser = {
      _id: generateId(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: userAvatar,
      createdAt: new Date(),
    };

    memoryDb.users.push(mockUser);
    saveDb();

    res.status(201).json({
      _id: mockUser._id,
      name: mockUser.name,
      email: mockUser.email,
      avatar: mockUser.avatar,
      token: generateToken(mockUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Database Connected Mode
    if (isDbConnected()) {
      const user = await User.findOne({ email });

      if (user && (await user.matchPassword(password))) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          token: generateToken(user._id),
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    // In-Memory Fallback Mode
    const user = memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password (In-Memory Database)' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    // Database Connected Mode
    if (isDbConnected()) {
      const user = await User.findById(req.user._id).select('-password');
      if (user) {
        return res.json(user);
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // In-Memory Fallback Mode
    const user = memoryDb.users.find((u) => u._id === req.user._id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ message: 'User not found in memory store' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password (Forgot Password fallback)
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Database Connected Mode
    if (isDbConnected()) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User with this email not found' });
      }

      user.password = password; // Pre-save hook will hash it!
      await user.save();

      return res.json({ message: 'Password updated successfully' });
    }

    // In-Memory Fallback Mode
    const userIndex = memoryDb.users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User with this email not found (In-Memory Database)' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    memoryDb.users[userIndex].password = hashedPassword;
    saveDb();

    res.json({ message: 'Password updated successfully (In-Memory Database)' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
