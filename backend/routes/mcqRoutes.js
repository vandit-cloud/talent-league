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

// Get stats for recruiter dashboard
router.get('/stats', getRecruiterStats);

// Create and send MCQ test via email
router.post('/create', createAndSendMCQTest);

// List tests (basic admin/recruiter view)
router.get('/all', listMCQTests);

// Verify test token
router.get('/verify/:token', verifyTestToken);

// Get test questions (without correct answers)
router.get('/questions/:token', getTestQuestions);

// Submit test answers
router.post('/submit/:token', submitTest);

// Submit phase 2 answers
router.post('/phase2-submit/:token', submitPhase2);

// Get test result
router.get('/result/:token', getTestResult);

// Get Phase 2 resume/assessment context by token
router.get('/phase2-context/:token', getPhase2Context);

// Get combined Phase 1 + Phase 2 result
router.get('/assessment-result/:token', getAssessmentResult);

module.exports = router;
