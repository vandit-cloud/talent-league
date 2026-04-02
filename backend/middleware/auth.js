const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const offlineStore = require('../utils/offlineStore');

const isDbConnected = () => mongoose.connection.readyState === 1;
const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret';

/**
 * @middleware protect
 * Verifies JWT token and attaches req.user to the request.
 * Returns 401 if token is missing or invalid.
 */
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
        return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        const userId = decoded?.id ? String(decoded.id) : '';

        if (!userId) {
            return res.status(401).json({ message: 'Not authorized. Invalid token.' });
        }

        let user = null;

        if (isDbConnected() && mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId);
        }

        if (!user) {
            const offlineUser = offlineStore.findUserById(userId);
            if (offlineUser) {
                user = offlineUser;
            }
        }

        if (!user) {
            return res.status(401).json({ message: 'Not authorized. User not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized. Token failed.' });
    }
};

/**
 * @middleware authorize
 * Checks if the authenticated user has one of the allowed roles.
 * Must be used AFTER protect middleware.
 * Returns 403 if role is not allowed.
 *
 * Usage: authorize('recruiter', 'admin')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. This action requires one of these roles: ${roles.join(', ')}.`
            });
        }

        next();
    };
};

/**
 * @middleware requireVerified
 * For recruiter-only routes, checks that the recruiter's company is verified.
 * Must be used AFTER protect and authorize('recruiter') middleware.
 * Returns 403 if company verification is pending.
 */
const requireVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized.' });
    }

    // Admins bypass verification check
    if (req.user.role === 'admin') {
        return next();
    }

    // Only enforce on recruiters
    if (req.user.role === 'recruiter') {
        if (!req.user.companyVerified || req.user.verificationStatus !== 'verified') {
            return res.status(403).json({
                message: 'Company verification pending. Please wait for your GST/CIN verification to be approved before accessing this feature.',
                verificationStatus: req.user.verificationStatus || 'pending'
            });
        }
    }

    next();
};

module.exports = { protect, authorize, requireVerified };
