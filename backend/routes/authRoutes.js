const express = require('express');
const router = express.Router();
const { registerUser, registerRecruiter, loginUser, updateProfile, forgotPassword, verifyForgotPasswordOtp, resetPassword, verifySignupOtp, resendSignupOtp, getMe, verifyCompany } = require('../controllers/authController');
const { startOAuth, handleOAuthCallback } = require('../controllers/authOAuthController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/register-recruiter', registerRecruiter);
router.post('/register/verify-otp', verifySignupOtp);
router.post('/register/resend-otp', resendSignupOtp);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);
router.post('/google/verify', require('../controllers/authController').verifyGoogleToken);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/verify-company', protect, authorize('admin'), verifyCompany);

// OAuth routes
router.get('/oauth/:provider/start', startOAuth);
router.get('/oauth/:provider/callback', handleOAuthCallback);

// Sandbox/Developer Simulation routes
const { renderSandboxLogin, handleSandboxComplete } = require('../controllers/authOAuthController');
router.get('/oauth/sandbox/login', renderSandboxLogin);
router.post('/oauth/sandbox/complete', express.urlencoded({ extended: true }), handleSandboxComplete);

module.exports = router;
