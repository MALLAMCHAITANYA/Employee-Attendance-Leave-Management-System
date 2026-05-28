import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { ROLES, ROLE_VALUES } from '../utils/roles.js';
import sendEmail from '../utils/sendEmail.js';
import AuditLog from '../models/AuditLog.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, dob, age, department, branch } = req.body;

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

    const user = await User.create({ name, email, password, role, dob, age, department, branch });

    await AuditLog.create({
      user: user._id,
      action: 'SIGNUP',
      details: `Signed up as a new user with role ${role} in department ${user.department}`,
      ipAddress: req.ip
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dob: user.dob,
        age: user.age,
        department: user.department,
        branch: user.branch,
        twoFactorEnabled: user.twoFactorEnabled
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

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ tempId: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
      return res.json({ require2FA: true, tempToken });
    }

    await AuditLog.create({
      user: user._id,
      action: 'LOGIN',
      details: 'Logged in successfully',
      ipAddress: req.ip
    });

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dob: user.dob,
        age: user.age,
        department: user.department,
        branch: user.branch,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await AuditLog.create({
        user: req.user._id,
        action: 'LOGOUT',
        details: 'Logged out successfully',
        ipAddress: req.ip
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/login?token=${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b;">Work Space Password Reset</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          You requested to reset your password for your Work Space employee portal account. 
          Please click the button below to set a new password. This link is valid for 1 hour.
        </p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.6;">
          If the button above does not work, copy and paste this URL into your browser: <br/>
          <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 11px;">
          If you did not request this password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    const textContent = `You requested a password reset. Please use the following link to configure a new password: ${resetUrl}`;

    // Send email using utility helper
    const mailResult = await sendEmail({
      to: user.email,
      subject: 'Work Space - Reset Your Password',
      html: htmlContent,
      text: textContent
    });

    const isMock = mailResult && mailResult.mock;
    res.json({
      message: isMock 
        ? 'Password reset link generated. Check the backend server terminal console!' 
        : 'Password reset link sent to your email address!'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    next(error);
  }
};

