import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, 'memoryDb.json');

// Default Demo User credentials
const defaultHashedPassword = bcrypt.hashSync('password123', 10);
const defaultUser = {
  _id: 'default-demo-user-id',
  name: 'Demo User',
  email: 'demo@collabdocs.com',
  password: defaultHashedPassword,
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  createdAt: new Date(),
};

// Volatile reference mapping used by controllers
export const memoryDb = {
  users: [defaultUser],
  documents: [],
  versions: [],
};

// Check if database is connected
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Helper to generate mock MongoDB ObjectId string
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Load JSON data from file at startup
export const loadDb = () => {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const rawData = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(rawData);
      
      memoryDb.users = parsed.users || [];
      memoryDb.documents = parsed.documents || [];
      memoryDb.versions = parsed.versions || [];

      // Always guarantee default demo user exists
      if (!memoryDb.users.some((u) => u.email === defaultUser.email)) {
        memoryDb.users.push(defaultUser);
      }
    } else {
      memoryDb.users = [defaultUser];
      saveDb();
    }
  } catch (error) {
    console.error('Failed to load local DB fallback file:', error.message);
    memoryDb.users = [defaultUser];
  }
};

// Save JSON data back to file on updates
export const saveDb = () => {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write updates to local DB fallback file:', error.message);
  }
};
