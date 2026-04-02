const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const offlineStore = require('../utils/offlineStore');
const { sendHtmlEmail } = require('../utils/emailSender');

const isDbConnected = () => mongoose.connection.readyState === 1;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const PASSWORD_RULE_MESSAGE = 'Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character like @ or _.';
const RESET_OTP_VALIDITY_MS = 10 * 60 * 1000;
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
const PROFILE_NAME_MAX_LENGTH = 80;
const PROFILE_PHONE_MAX_LENGTH = 30;
const PROFILE_LOCATION_MAX_LENGTH = 120;
const PROFILE_AVATAR_MAX_LENGTH = 3_000_000;

const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');
const generateResetOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret';

const findUserForPasswordReset = async (email) => {
    if (isDbConnected()) {
        const dbUser = await User.findOne({ email });
        if (dbUser) {
            return { user: dbUser, source: 'db' };
        }
    }

    const offlineUser = offlineStore.findUserByEmail(email);
    if (offlineUser) {
        return { user: offlineUser, source: 'offline' };
    }

    return { user: null, source: null };
};

const findAllUsersForPasswordReset = async (email) => {
    const matches = [];

    if (isDbConnected()) {
        const dbUsers = await User.find({ email });
        dbUsers.forEach((user) => {
            matches.push({ user, source: 'db' });
        });
    }

    const offlineUsers = offlineStore.findUsersByEmail(email);
    offlineUsers.forEach((user) => {
        matches.push({ user, source: 'offline' });
    });

    return matches;
};

const hasValidOtp = (user, otp) => {
    if (!user?.resetPasswordToken || !user?.resetPasswordExpires || !otp) {
        return false;
    }

    const expiresAt = new Date(user.resetPasswordExpires).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        return false;
    }

    return user.resetPasswordToken === hashValue(otp);
};

const getOtpValidationTargets = async (email) => {
    const matches = await findAllUsersForPasswordReset(email);
    return matches.filter(({ user }) => !user?.isSocialOnly || !!user?.password);
};

const buildResetOtpEmailHtml = ({ name, otp }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #ffffff; padding: 32px; border-radius: 18px;">
        <div style="margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 28px; color: #ffffff;">Your TalentLeague password reset OTP</h2>
            <p style="margin: 12px 0 0; color: #cbd5e1; line-height: 1.7;">Hello ${name || 'there'}, use the one-time password below to continue your password reset.</p>
        </div>

        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); padding: 20px; border-radius: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px; color: #94a3b8; font-size: 14px;">Enter this OTP on the TalentLeague forgot password page:</p>
            <div style="font-size: 34px; letter-spacing: 10px; font-weight: 700; color: #ffffff; text-align: center; background: rgba(99,102,241,0.18); border-radius: 14px; padding: 18px 12px;">
                ${otp}
            </div>
        </div>

        <p style="margin: 0; color: #cbd5e1; line-height: 1.8;">After OTP verification, you can set your new password.</p>
        <p style="margin: 16px 0 0; color: #e2e8f0; font-size: 15px;"><strong>Password rules</strong></p>
        <ul style="margin: 8px 0 0; padding-left: 18px; color: #cbd5e1; line-height: 1.8;">
            <li>At least 8 characters</li>
            <li>1 uppercase letter</li>
            <li>1 lowercase letter</li>
            <li>1 number</li>
            <li>1 special character like @ or _</li>
        </ul>

        <p style="margin: 26px 0 0; color: #fbbf24;">This OTP expires in 10 minutes.</p>
        <p style="margin: 10px 0 0; color: #64748b;">If you did not request this, you can safely ignore this email.</p>
    </div>
`;

const cleanOptionalString = (value, maxLength) => {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().slice(0, maxLength);
};

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const CIN_REGEX = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;

const buildUserPayload = (user, extra = {}) => ({
    _id: String(user?._id || ''),
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'candidate',
    avatar: user?.avatar || undefined,
    contactInfo: {
        phone: user?.phone || user?.contactInfo?.phone || '',
        location: user?.location || user?.contactInfo?.location || ''
    },
    onboardingComplete: Boolean(user?.onboardingComplete),
    companyName: user?.companyName || undefined,
    gstNumber: user?.gstNumber || undefined,
    cinNumber: user?.cinNumber || undefined,
    udyamNumber: user?.udyamNumber || undefined,
    companyVerified: Boolean(user?.companyVerified),
    verificationStatus: user?.verificationStatus || 'not_required',
    ...extra
});

const getBearerToken = (req) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.slice(7).trim();
};

const getAuthenticatedUser = async (req) => {
    const token = getBearerToken(req);
    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        const userId = decoded?.id ? String(decoded.id) : '';

        if (!userId) {
            return null;
        }

        if (isDbConnected() && mongoose.Types.ObjectId.isValid(userId)) {
            const dbUser = await User.findById(userId);
            if (dbUser) {
                return { user: dbUser, source: 'db', token };
            }
        }

        const offlineUser = offlineStore.findUserById(userId);
        if (offlineUser) {
            return { user: offlineUser, source: 'offline', token };
        }

        return null;
    } catch (error) {
        return null;
    }
};

const isEmailAvailableForUser = async (email, currentUserId) => {
    if (isDbConnected()) {
        const dbUser = await User.findOne({ email });
        if (dbUser && String(dbUser._id) !== String(currentUserId)) {
            return false;
        }
    }

    const offlineUser = offlineStore.findUserByEmail(email);
    if (offlineUser && String(offlineUser._id) !== String(currentUserId)) {
        return false;
    }

    return true;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const SIGNUP_OTP_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes

const buildSignupOtpEmailHtml = (otp, name) => `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px;">
        <div style="background: #ffffff; border-radius: 12px; padding: 32px; text-align: center;">
            <h1 style="margin: 0 0 8px; font-size: 24px; color: #1e1b4b;">Verify Your Email</h1>
            <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">Hi ${name}, welcome to TalentLeague!</p>
            <p style="margin: 0 0 8px; color: #475569; font-size: 14px;">Your verification code is:</p>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 16px 0;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
            </div>
            <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">This code expires in 10 minutes.</p>
            <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px;">If you didn't create an account, ignore this email.</p>
        </div>
    </div>
`;

const sendSignupOtp = async (user, name) => {
    const otp = generateResetOtp();
    const hashedOtp = hashValue(otp);
    const expires = new Date(Date.now() + SIGNUP_OTP_VALIDITY_MS);

    if (isDbConnected() && user.save) {
        user.signupOtpToken = hashedOtp;
        user.signupOtpExpires = expires;
        await user.save();
    } else {
        offlineStore.updateUser(user._id, {
            signupOtpToken: hashedOtp,
            signupOtpExpires: expires.toISOString()
        });
    }

    await sendHtmlEmail({
        to: user.email,
        subject: 'TalentLeague - Verify Your Email',
        html: buildSignupOtpEmailHtml(otp, name)
    });

    return otp;
};

const registerUser = async (req, res) => {
    const { name, password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    // SECURITY: This endpoint only creates candidate accounts.
    // Recruiters must use /register-recruiter with GST/CIN verification.
    const role = 'candidate';

    console.log('Registration request received:', { name, email, role });

    try {
        if (!PASSWORD_REGEX.test(password || '')) {
            return res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
        }

        if (isDbConnected()) {
            const userExists = await User.findOne({ email });
            if (userExists) {
                if (userExists.emailVerified) {
                    const roleMsg = userExists.role ? `This email is already registered as a ${userExists.role}. Please log in.` : 'User already exists';
                    return res.status(400).json({ message: roleMsg });
                }
                // User exists but not verified - resend OTP
                await sendSignupOtp(userExists, userExists.name);
                return res.status(201).json({
                    emailVerificationPending: true,
                    email: userExists.email,
                    message: 'Verification OTP resent to your email.'
                });
            }

            const user = await User.create({ name, email, password, role, emailVerified: false, verificationStatus: 'not_required' });
            await sendSignupOtp(user, name);

            return res.status(201).json({
                emailVerificationPending: true,
                email: user.email,
                message: 'Account created. Please verify your email with the OTP sent.'
            });
        } else {
            // OFFLINE MODE
            const userExists = offlineStore.findUserByEmail(email);
            if (userExists) {
                if (userExists.emailVerified) {
                    const roleMsg = userExists.role ? `This email is already registered as a ${userExists.role}. Please log in.` : 'User already exists (offline storage)';
                    return res.status(400).json({ message: roleMsg });
                }
                // Not verified - resend OTP
                await sendSignupOtp(userExists, userExists.name);
                return res.status(201).json({
                    emailVerificationPending: true,
                    email: userExists.email,
                    message: 'Verification OTP resent to your email.'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = offlineStore.addUser({
                name, email, password: hashedPassword, role, emailVerified: false, verificationStatus: 'not_required'
            });

            await sendSignupOtp(user, name);

            return res.status(201).json({
                emailVerificationPending: true,
                email: user.email,
                message: 'Account created. Please verify your email with the OTP sent.'
            });
        }
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Verify signup email OTP
// @route   POST /api/auth/register/verify-otp
// @access  Public
const verifySignupOtp = async (req, res) => {
    const { otp } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    try {
        let user = null;
        let source = 'db';

        if (isDbConnected()) {
            user = await User.findOne({ email });
        } else {
            user = offlineStore.findUserByEmail(email);
            source = 'offline';
        }

        if (!user) {
            return res.status(400).json({ message: 'No account found with this email.' });
        }
        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email is already verified. Please log in.' });
        }

        const hashedOtp = hashValue(otp);
        if (user.signupOtpToken !== hashedOtp || !user.signupOtpExpires || new Date(user.signupOtpExpires).getTime() < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
        }

        if (source === 'db') {
            user.emailVerified = true;
            user.signupOtpToken = undefined;
            user.signupOtpExpires = undefined;
            await user.save();
        } else {
            offlineStore.updateUser(user._id, {
                emailVerified: true,
                signupOtpToken: undefined,
                signupOtpExpires: undefined
            });
        }

        return res.json({
            verified: true,
            message: 'Email verified successfully! You can now log in.',
            ...buildUserPayload(user, { token: generateToken(user._id), mode: source === 'db' ? 'online' : 'offline' })
        });
    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Resend signup OTP
// @route   POST /api/auth/register/resend-otp
// @access  Public
const resendSignupOtp = async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        let user = null;

        if (isDbConnected()) {
            user = await User.findOne({ email });
        } else {
            user = offlineStore.findUserByEmail(email);
        }

        if (!user) {
            return res.status(400).json({ message: 'No account found with this email.' });
        }
        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email is already verified.' });
        }

        await sendSignupOtp(user, user.name);
        return res.json({ message: 'New OTP sent to your email.' });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { password, role } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    try {
        if (isDbConnected()) {
            // ONLINE MODE (MongoDB)
            const user = await User.findOne({ email }).select('+password');
            if (user) {
                if (!user.emailVerified) {
                    return res.status(403).json({
                        message: 'Please verify your email first.',
                        emailVerificationPending: true,
                        email: user.email
                    });
                }
                if (role && user.role && user.role !== role) {
                    return res.status(401).json({ message: `This account is registered as a ${user.role}. Please go to the ${user.role} login page.` });
                }
                if (await user.matchPassword(password)) {
                    return res.json(buildUserPayload(user, {
                        token: generateToken(user._id),
                        mode: 'online'
                    }));
                }
            }
        } else {
            // OFFLINE MODE (JSON Fallback)
            const user = offlineStore.findUserByEmail(email);
            if (user) {
                if (!user.emailVerified) {
                    return res.status(403).json({
                        message: 'Please verify your email first.',
                        emailVerificationPending: true,
                        email: user.email
                    });
                }
                if (role && user.role && user.role !== role) {
                    return res.status(401).json({ message: `This account is registered as a ${user.role}. Please go to the ${user.role} login page.` });
                }
                if (await bcrypt.compare(password, user.password)) {
                    return res.json(buildUserPayload(user, {
                        token: generateToken(user._id),
                        mode: 'offline'
                    }));
                }
            }
        }

        res.status(401).json({ message: 'Invalid email or password' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update authenticated user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);

        if (!authenticatedUser) {
            return res.status(401).json({ message: 'Unauthorized. Please sign in again.' });
        }

        const { user, source, token } = authenticatedUser;
        const name = cleanOptionalString(req.body?.name ?? user.name, PROFILE_NAME_MAX_LENGTH);
        const email = cleanOptionalString(req.body?.email ?? user.email, 160).toLowerCase();
        const phone = cleanOptionalString(req.body?.phone ?? user.phone ?? '', PROFILE_PHONE_MAX_LENGTH);
        const location = cleanOptionalString(req.body?.location ?? user.location ?? '', PROFILE_LOCATION_MAX_LENGTH);
        const avatar = typeof req.body?.avatar === 'string' ? req.body.avatar.trim() : (user.avatar || '');

        if (!name) {
            return res.status(400).json({ message: 'Name is required.' });
        }

        if (!email || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        if (avatar.length > PROFILE_AVATAR_MAX_LENGTH) {
            return res.status(400).json({ message: 'Profile photo is too large. Please upload a smaller image.' });
        }

        const emailChanged = email !== String(user.email || '').toLowerCase();
        const emailAvailable = emailChanged ? await isEmailAvailableForUser(email, user._id) : true;
        if (!emailAvailable) {
            return res.status(409).json({ message: 'That email is already linked to another account.' });
        }

        if (source === 'db') {
            user.name = name;
            user.email = email;
            user.phone = phone || undefined;
            user.location = location || undefined;
            user.avatar = avatar || undefined;
            await user.save();

            return res.json(buildUserPayload(user, {
                token,
                mode: 'online'
            }));
        }

        const updatedUser = offlineStore.updateUser(user._id, {
            name,
            email,
            phone: phone || undefined,
            location: location || undefined,
            avatar: avatar || undefined
        });

        return res.json(buildUserPayload(updatedUser, {
            token,
            mode: 'offline'
        }));
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ message: 'Failed to update profile' });
    }
};

// @desc    Send forgot password OTP email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const matches = await getOtpValidationTargets(email);
        let primaryMatch = matches[0];

        if (!primaryMatch) {
            return res.json({ message: 'If an account exists with this email, an OTP has been sent.' });
        }

        let { user, source } = primaryMatch;

        if (user.isSocialOnly && !user.password) {
            return res.status(400).json({ message: 'This account uses social login. Please sign in with Google or LinkedIn.' });
        }

        const otp = generateResetOtp();
        const hashedOtp = hashValue(otp);
        const resetPasswordExpires = new Date(Date.now() + RESET_OTP_VALIDITY_MS);

        for (const match of matches) {
            if (match.source === 'db') {
                match.user.resetPasswordToken = hashedOtp;
                match.user.resetPasswordExpires = resetPasswordExpires;
                await match.user.save({ validateBeforeSave: false });
            } else {
                offlineStore.updateUser(match.user._id, {
                    resetPasswordToken: hashedOtp,
                    resetPasswordExpires: resetPasswordExpires.toISOString()
                });
            }
        }

        const emailResult = await sendHtmlEmail({
            to: user.email,
            subject: 'Your TalentLeague password reset OTP',
            html: buildResetOtpEmailHtml({
                name: user.name,
                otp
            })
        });

        if (emailResult.previewUrl) {
            console.log(`Password reset OTP preview URL for ${user.email}: ${emailResult.previewUrl}`);
        }

        return res.json({ message: 'If an account exists with this email, an OTP has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        return res.status(500).json({ message: 'Failed to send password reset OTP' });
    }
};

// @desc    Verify password reset OTP
// @route   POST /api/auth/forgot-password/verify-otp
// @access  Public
const verifyForgotPasswordOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const matches = await getOtpValidationTargets(email);
        const validMatch = matches.find(({ user }) => hasValidOtp(user, otp));

        if (!validMatch) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        return res.json({ message: 'OTP verified. You can now create a new password.' });
    } catch (err) {
        console.error('Verify forgot password OTP error:', err);
        return res.status(500).json({ message: 'Failed to verify OTP' });
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { email, otp, password, confirmPassword } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        if (!otp) {
            return res.status(400).json({ message: 'OTP is required.' });
        }

        if (!PASSWORD_REGEX.test(password || '')) {
            return res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        const matches = await getOtpValidationTargets(email);
        const validMatch = matches.find(({ user }) => hasValidOtp(user, otp));

        if (!validMatch) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        for (const match of matches) {
            if (match.source === 'db') {
                match.user.password = password;
                match.user.isSocialOnly = false;
                match.user.resetPasswordToken = undefined;
                match.user.resetPasswordExpires = undefined;
                await match.user.save();
            } else {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                offlineStore.updateUser(match.user._id, {
                    password: hashedPassword,
                    isSocialOnly: false,
                    resetPasswordToken: undefined,
                    resetPasswordExpires: undefined
                });
            }
        }

        return res.json({ message: 'Password updated successfully. Please sign in with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ message: 'Failed to reset password' });
    }
};

const Identity = require('../models/Identity');

// @desc    Verify Google ID Token and Login/Register
// @route   POST /api/auth/google/verify
// @access  Public
const verifyGoogleToken = async (req, res) => {
    const { token, role } = req.body;
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture: avatar } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            // SECURITY: Always create OAuth users as candidates.
            // Recruiters must go through /register-recruiter with GST/CIN verification.
            user = await User.create({
                name,
                email,
                avatar,
                role: 'candidate',
                isSocialOnly: true,
                emailVerified: true,
                verificationStatus: 'not_required'
            });
        } else if (role && user.role !== role) {
            return res.status(401).json({
                message: `This account is registered as a ${user.role}. Please select "${user.role}" to sign in.`
            });
        } else {
            // Update avatar/name if missing
            let changed = false;
            if (!user.avatar && avatar) { user.avatar = avatar; changed = true; }
            if (!user.name && name) { user.name = name; changed = true; }
            if (changed) await user.save();
        }

        // Link Identity
        await Identity.findOneAndUpdate(
            { provider: 'google', providerUserId: googleId },
            {
                userId: user._id,
                emailFromProvider: email,
                emailVerifiedByProvider: true,
                profileSnapshot: { name, avatar, raw: payload },
                lastSyncAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json(buildUserPayload(user, {
            token: generateToken(user._id),
            mode: 'online'
        }));
    } catch (error) {
        console.error('Google Verification Error:', error.message);
        console.error('GOOGLE_CLIENT_ID used:', process.env.GOOGLE_CLIENT_ID);
        res.status(401).json({ message: 'Invalid Google Token: ' + error.message });
    }
};

// @desc    Register a new recruiter with company verification
// @route   POST /api/auth/register-recruiter
// @access  Public
const registerRecruiter = async (req, res) => {
    const { name, password, companyName, gstNumber, cinNumber, udyamNumber } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    console.log('Recruiter registration request received:', { name, email, companyName });

    try {
        if (!PASSWORD_REGEX.test(password || '')) {
            return res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
        }

        if (!companyName || !companyName.trim()) {
            return res.status(400).json({ message: 'Company name is required for recruiter registration.' });
        }

        const gst = (gstNumber || '').trim().toUpperCase();
        const cin = (cinNumber || '').trim().toUpperCase();
        const udyam = (udyamNumber || '').trim().toUpperCase();

        // At least one of GST or CIN is required
        if (!gst && !cin) {
            return res.status(400).json({ message: 'Either GST Number or CIN Number is required for recruiter registration.' });
        }

        // Validate formats
        if (gst && !GST_REGEX.test(gst)) {
            return res.status(400).json({ message: 'Invalid GST number format. Expected: 22AAAAA0000A1Z5 (15 characters).' });
        }

        if (cin && !CIN_REGEX.test(cin)) {
            return res.status(400).json({ message: 'Invalid CIN number format. Expected: U12345MH2020PTC123456 (21 characters).' });
        }

        if (udyam && !UDYAM_REGEX.test(udyam)) {
            return res.status(400).json({ message: 'Invalid UDYAM number format. Expected: UDYAM-MH-00-0000000.' });
        }

        if (isDbConnected()) {
            // Check email uniqueness
            const userExists = await User.findOne({ email });
            if (userExists) {
                if (userExists.emailVerified) {
                    const roleMsg = userExists.role ? `This email is already registered as a ${userExists.role}. Please log in.` : 'User already exists';
                    return res.status(400).json({ message: roleMsg });
                }
                // User exists but not verified - resend OTP
                await sendSignupOtp(userExists, userExists.name);
                return res.status(201).json({
                    emailVerificationPending: true,
                    email: userExists.email,
                    message: 'Verification OTP resent to your email.'
                });
            }

            // Check GST/CIN uniqueness
            if (gst) {
                const gstExists = await User.findOne({ gstNumber: gst });
                if (gstExists) {
                    return res.status(400).json({ message: 'This GST number is already registered by another company.' });
                }
            }

            if (cin) {
                const cinExists = await User.findOne({ cinNumber: cin });
                if (cinExists) {
                    return res.status(400).json({ message: 'This CIN number is already registered by another company.' });
                }
            }

            const user = await User.create({
                name,
                email,
                password,
                role: 'recruiter',
                companyName: companyName.trim(),
                gstNumber: gst || undefined,
                cinNumber: cin || undefined,
                udyamNumber: udyam || undefined,
                companyVerified: false,
                verificationStatus: 'pending',
                emailVerified: false
            });

            await sendSignupOtp(user, name);

            return res.status(201).json({
                emailVerificationPending: true,
                email: user.email,
                message: 'Recruiter account created. Please verify your email with the OTP sent.'
            });
        } else {
            // OFFLINE MODE
            const userExists = offlineStore.findUserByEmail(email);
            if (userExists) {
                if (userExists.emailVerified) {
                    const roleMsg = userExists.role ? `This email is already registered as a ${userExists.role}. Please log in.` : 'User already exists (offline storage)';
                    return res.status(400).json({ message: roleMsg });
                }
                await sendSignupOtp(userExists, userExists.name);
                return res.status(201).json({
                    emailVerificationPending: true,
                    email: userExists.email,
                    message: 'Verification OTP resent to your email.'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = offlineStore.addUser({
                name,
                email,
                password: hashedPassword,
                role: 'recruiter',
                companyName: companyName.trim(),
                gstNumber: gst || undefined,
                cinNumber: cin || undefined,
                udyamNumber: udyam || undefined,
                companyVerified: false,
                verificationStatus: 'pending',
                emailVerified: false
            });

            await sendSignupOtp(user, name);

            return res.status(201).json({
                emailVerificationPending: true,
                email: user.email,
                message: 'Recruiter account created. Please verify your email with the OTP sent.'
            });
        }
    } catch (err) {
        console.error('Recruiter registration error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get current authenticated user info
// @route   GET /api/auth/me
// @access  Private (requires protect middleware)
const getMe = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Not authorized.' });
        }

        return res.json(buildUserPayload(user, { mode: 'online' }));
    } catch (err) {
        console.error('Get me error:', err);
        return res.status(500).json({ message: 'Failed to get user info.' });
    }
};

// @desc    Verify a recruiter's company (admin only)
// @route   POST /api/auth/verify-company
// @access  Private (admin only, requires protect + authorize('admin'))
const verifyCompany = async (req, res) => {
    const { userId, action, note } = req.body;

    try {
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        if (!['verify', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Action must be "verify" or "reject".' });
        }

        if (!isDbConnected()) {
            return res.status(503).json({ message: 'Database not connected. Cannot verify in offline mode.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.role !== 'recruiter') {
            return res.status(400).json({ message: 'Only recruiter accounts can be verified.' });
        }

        if (action === 'verify') {
            user.companyVerified = true;
            user.verificationStatus = 'verified';
            user.verifiedAt = new Date();
            user.verifiedBy = req.user._id;
            user.verificationNote = note || 'Approved';
        } else {
            user.companyVerified = false;
            user.verificationStatus = 'rejected';
            user.verificationNote = note || 'Rejected';
        }

        await user.save();

        return res.json({
            message: `Recruiter ${action === 'verify' ? 'verified' : 'rejected'} successfully.`,
            user: buildUserPayload(user)
        });
    } catch (err) {
        console.error('Verify company error:', err);
        return res.status(500).json({ message: 'Failed to verify company.' });
    }
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, getJwtSecret(), {
        expiresIn: '30d',
    });
};

module.exports = {
    buildUserPayload,
    registerUser,
    registerRecruiter,
    loginUser,
    updateProfile,
    forgotPassword,
    verifyForgotPasswordOtp,
    resetPassword,
    verifyGoogleToken,
    verifySignupOtp,
    resendSignupOtp,
    generateToken,
    getMe,
    verifyCompany
};
