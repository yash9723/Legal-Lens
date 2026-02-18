import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authLimiter } from '../middleware/security';
import { logger } from '../utils/logger';

import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();
// @ts-ignore
const speakeasy = require('speakeasy');
import QRCode from 'qrcode';
import Joi from 'joi';

// Shared Password Validation Schema
const passwordComplexity = Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
    .required()
    .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)',
        'string.min': 'Password must be at least 6 characters long'
    });

// Joi Schemas
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: passwordComplexity
});

// Register
router.post('/register', authLimiter, async (req, res) => {
    try {
        // Validate input
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { name, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password,
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            id: user.id,
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan } });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password, googleToken } = req.body;
        const ip = req.ip || req.connection.remoteAddress || 'unknown';



        const user = await User.findOne({ email });
        if (!user) {
            logger.logAuthFailure(email, ip as string, 'User not found');
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        if (user.password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                logger.logAuthFailure(email, ip as string, 'Invalid password');
                return res.status(400).json({ message: 'Invalid Credentials' });
            }
        } else {
            // If no password (e.g. google user trying to login with password), fail
            if (password) {
                logger.logAuthFailure(email, ip as string, 'Password login attempted for Google-only account');
                return res.status(400).json({ message: 'Invalid Credentials' });
            }
        }

        const payload = {
            id: user.id,
        };

        if (user.isTwoFactorEnabled) {
            const tempToken = jwt.sign({ id: user.id, type: '2fa_pending' }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '5m' });
            return res.json({
                twoFactorRequired: true,
                tempToken
            });
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                // @ts-ignore
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, isTwoFactorEnabled: user.isTwoFactorEnabled } });
            }
        );
    } catch (err: any) {
        console.error('Login Error:', err);
        logger.error('Login API Error', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Update Profile
router.put('/update-profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { id: string };
        const { name, avatarUrl } = req.body;

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl; // Allow clearing if needed

        await user.save();

        res.json({ user: { id: user.id, name: user.name, email: user.email, plan: user.plan, avatarUrl: user.avatarUrl } });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Change Password
router.put('/change-password', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { id: string };
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Verify current password
        if (user.password) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ message: 'Invalid current password' });
        }

        // Validate new password (using same Joi schema logic)
        const { error } = passwordComplexity.validate(newPassword);
        if (error) return res.status(400).json({ message: 'New password does not meet security requirements' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Forgot Password
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP and set to resetPasswordToken field
        const salt = await bcrypt.genSalt(10);
        user.resetPasswordToken = await bcrypt.hash(otp, salt);

        // Set expire (10 mins)
        user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

        await user.save();

        // Log OTP (as requested)
        logger.info(`PASSWORD RESET OTP`, {
            to: user.email,
            otp: otp
        });

        console.log(`[OTP-LOG] Password Reset OTP for ${user.email}: ${otp}`);

        res.status(200).json({ message: 'OTP logged to console' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Reset Password with OTP
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user || !user.resetPasswordToken) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const isMatch = await bcrypt.compare(otp, user.resetPasswordToken);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Validate new password (using same Joi schema logic)
        const { error } = passwordComplexity.validate(password);
        if (error) return res.status(400).json({ message: 'Password does not meet security requirements' });


        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Upgrade Plan
router.put('/upgrade-plan', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { id: string };
        const { plan } = req.body;

        const validPlans = ['Free', 'Starter', 'Professional', 'Team'];
        if (!validPlans.includes(plan)) {
            return res.status(400).json({ message: 'Invalid plan selected' });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        user.plan = plan;
        await user.save();

        res.json({
            message: `Successfully upgraded to ${plan} plan`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                avatarUrl: user.avatarUrl,
                documentsAnalyzed: user.documentsAnalyzed
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Google Login Endpoint
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'No token provided' });
        }

        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({ message: 'Invalid Google Token' });
        }

        const { email, name, picture, sub: googleId } = payload;

        if (!email) {
            return res.status(400).json({ message: 'Email not found in Google Token' });
        }

        // Find or Create User
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                name: name || 'Google User',
                email,
                password: '', // No password for google users
                googleId,
                avatarUrl: picture,
                plan: 'Free',
                role: 'user'
            });
            await user.save();
        } else {
            // Update existing user metadata if needed
            if (!user.googleId) user.googleId = googleId;
            if (!user.avatarUrl) user.avatarUrl = picture;
            await user.save();
        }

        // Generate JWT
        const jwtPayload = { id: user.id };
        jwt.sign(
            jwtPayload,
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        plan: user.plan || 'Free', // Ensure plan is set
                        role: user.role || 'user',
                        avatarUrl: user.avatarUrl
                    }
                });
            }
        );

    } catch (err: any) {
        console.error('Google Auth Error:', err);
        res.status(401).json({
            message: `Google Authentication Failed: ${err.message}`,
            details: JSON.stringify(err)
        });
    }
});

// 2FA: Generate Secret
router.post('/2fa/generate', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { id: string };
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const secret = speakeasy.generateSecret({ name: `LegalLens AI (${user.email})` });
        const imageUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Save secret temporarily (or permanently but marked as not enabled yet)
        user.twoFactorSecret = secret.base32;
        await user.save();

        res.json({ secret: secret.base32, qrCode: imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 2FA: Verify and Enable
router.post('/2fa/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { id: string };
        const { token: userToken } = req.body;

        const user = await User.findById(decoded.id);
        if (!user || !user.twoFactorSecret) return res.status(400).json({ message: '2FA setup not initiated' });

        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: userToken,
            window: 1 // Allow 30sec margin
        });

        if (!isValid) return res.status(400).json({ message: 'Invalid 2FA code' });

        user.isTwoFactorEnabled = true;
        await user.save();

        res.json({ message: '2FA enabled successfully', isTwoFactorEnabled: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 2FA: Disable
router.post('/2fa/disable', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { id: string };
        const { password } = req.body; // Require password to disable

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Verify password if not google user
        if (user.password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: 'Invalid password' });
        }

        user.isTwoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        await user.save();

        res.json({ message: '2FA disabled successfully', isTwoFactorEnabled: false });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 2FA: Validate (for login)
router.post('/2fa/validate', async (req, res) => {
    try {
        const { tempToken, token: userToken } = req.body;

        // tempToken is a short-lived JWT that only contains ID but is not full access
        // For simplicity, we can use the same secret but different payload or check a flag.
        // Or we can just trust the ID if we signed it.
        // Let's decode it.
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'default_secret') as { id: string, type: string };

        if (decoded.type !== '2fa_pending') {
            return res.status(401).json({ message: 'Invalid session type' });
        }

        const user = await User.findById(decoded.id);
        if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ message: '2FA not enabled for this user' });
        }

        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: userToken,
            window: 1
        });

        if (!isValid) return res.status(400).json({ message: 'Invalid 2FA code' });

        // Issue real token
        const payload = { id: user.id };
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, isTwoFactorEnabled: true } });
            }
        );

    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Invalid session' });
    }
});



export default router;
