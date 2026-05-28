import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import https from 'https';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const getNetworkTimeOffset = () => {
  return new Promise((resolve) => {
    const client = https.get('https://www.google.com', { timeout: 1500 }, (res) => {
      const serverDateHeader = res.headers.date;
      if (serverDateHeader) {
        const serverTime = new Date(serverDateHeader).getTime();
        const localTime = Date.now();
        const offset = serverTime - localTime;
        resolve(offset);
      } else {
        resolve(0);
      }
    });
    client.on('error', () => resolve(0));
    client.on('timeout', () => {
      client.destroy();
      resolve(0);
    });
  });
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Generate speakeasy secret
    const secret = speakeasy.generateSecret({
      name: `Work Space (${user.email})`,
      issuer: 'Work Space'
    });

    // Save temporary secret to user model
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code data URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    next(error);
  }
};

export const verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA has not been set up yet' });
    }

    console.log('--- 2FA Setup Verification ---');
    console.log('Server Current Time:', new Date().toISOString());
    console.log('User Token Received:', token);

    const offsetMs = await getNetworkTimeOffset();
    const adjustedTime = Math.floor((Date.now() + offsetMs) / 1000);
    console.log('Network Offset (ms):', offsetMs);
    console.log('Adjusted Time (s):', adjustedTime);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      time: adjustedTime,
      window: 10 // Allow ±10 time steps (±300s / 5m) to account for client/server clock drifts
    });

    console.log('Verification Success:', verified);

    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA code. Verification failed.' });
    }

    user.twoFactorEnabled = true;
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: '2FA_ENABLE',
      details: 'Enabled Two-Factor Authentication',
      ipAddress: req.ip
    });

    res.json({
      message: 'Two-Factor Authentication verified and enabled successfully.',
      twoFactorEnabled: true
    });
  } catch (error) {
    next(error);
  }
};

export const disable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: '2FA_DISABLE',
      details: 'Disabled Two-Factor Authentication',
      ipAddress: req.ip
    });

    res.json({
      message: 'Two-Factor Authentication disabled successfully.',
      twoFactorEnabled: false
    });
  } catch (error) {
    next(error);
  }
};

export const login2FA = async (req, res, next) => {
  try {
    const { tempToken, token } = req.body;
    if (!tempToken || !token) {
      return res.status(400).json({ message: 'Temporary token and 2FA code are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired 2FA login session' });
    }

    const user = await User.findById(decoded.tempId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('--- 2FA Login Verification ---');
    console.log('Server Current Time:', new Date().toISOString());
    console.log('User Token Received:', token);

    const offsetMs = await getNetworkTimeOffset();
    const adjustedTime = Math.floor((Date.now() + offsetMs) / 1000);
    console.log('Network Offset (ms):', offsetMs);
    console.log('Adjusted Time (s):', adjustedTime);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      time: adjustedTime,
      window: 10 // Allow ±10 time steps (±300s / 5m) to account for client/server clock drifts
    });

    const expectedCurrentToken = speakeasy.totp({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      time: adjustedTime
    });
    console.log('Expected Current Token:', expectedCurrentToken);
    console.log('Verification Success:', verified);

    if (!verified) {
      return res.status(401).json({ message: 'Invalid 2FA code' });
    }

    const finalToken = generateToken(user._id, user.role);

    await AuditLog.create({
      user: user._id,
      action: 'LOGIN_2FA_SUCCESS',
      details: 'Logged in successfully using Two-Factor Authentication',
      ipAddress: req.ip
    });

    res.json({
      token: finalToken,
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
