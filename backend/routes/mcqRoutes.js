const express = require('express');
const router = express.Router();
const {
    createAndSendMCQTest,
    verifyTestToken,
    getTestQuestions,
    submitTest,
    submitPhase2,
    getTestResult,
    getPhase2Context,
    getAssessmentResult,
    listMCQTests,
    getRecruiterStats
} = require('../controllers/mcqController');
const { protect, authorize, requireVerified } = require('../middleware/auth');

// Recruiter-only routes (require verified company)
router.get('/stats', protect, authorize('recruiter', 'admin'), getRecruiterStats);
router.post('/create', protect, authorize('recruiter', 'admin'), requireVerified, createAndSendMCQTest);
router.get('/all', protect, authorize('recruiter', 'admin'), listMCQTests);

// Test-taking routes (token-based, accessible by candidates via unique link)
// These use their own token-based auth (test token), so no JWT protect needed
router.get('/verify/:token', verifyTestToken);
router.get('/questions/:token', getTestQuestions);
router.post('/submit/:token', submitTest);
router.post('/phase2-submit/:token', submitPhase2);

// Result routes
router.get('/result/:token', getTestResult);
router.get('/phase2-context/:token', getPhase2Context);
router.get('/assessment-result/:token', getAssessmentResult);

module.exports = router;
