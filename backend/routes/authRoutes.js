const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateProfile, forgotPassword, verifyForgotPasswordOtp, resetPassword } = require('../controllers/authController');
const { startOAuth, handleOAuthCallback } = require('../controllers/authOAuthController');

// Define routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/profile', updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);
router.post('/google/verify', require('../controllers/authController').verifyGoogleToken);

// OAuth routes
router.get('/oauth/:provider/start', startOAuth);
router.get('/oauth/:provider/callback', handleOAuthCallback);

// Sandbox/Developer Simulation routes
const { renderSandboxLogin, handleSandboxComplete } = require('../controllers/authOAuthController');
router.get('/oauth/sandbox/login', renderSandboxLogin);
router.post('/oauth/sandbox/complete', express.urlencoded({ extended: true }), handleSandboxComplete);

module.exports = router;
