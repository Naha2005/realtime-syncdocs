import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { memoryDb, isDbConnected } from '../config/inMemoryDB.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_collabdocs_key_12345');
      
      // Database Connected Mode
      if (isDbConnected()) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        // In-Memory Fallback Mode
        const mockUser = memoryDb.users.find((u) => u._id === decoded.id);
        if (mockUser) {
          const { password, ...userWithoutPassword } = mockUser;
          req.user = userWithoutPassword;
        }
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not found, unauthorized' });
      }
      
      return next();
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
