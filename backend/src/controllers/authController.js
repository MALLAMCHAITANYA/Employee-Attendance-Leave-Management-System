import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ROLES, ROLE_VALUES } from '../utils/roles.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, dob, age } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All required fields missing' });
    }

    if (!ROLE_VALUES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role, dob, age });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dob: user.dob,
        age: user.age
      }
    });
  } catch (error) {
    next(error);
  }
};

// On login: create attendance record with loginTime
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ message: 'Role mismatch' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dob: user.dob,
        age: user.age
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

