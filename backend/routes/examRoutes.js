const express = require('express');
const router = express.Router();
const { getQuestions, submitResult, seedQuestions, generateQuestions, generatePhase2Questions } = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

// Routes
router.get('/questions', protect, getQuestions);
router.post('/submit', protect, authorize('candidate'), submitResult);
router.post('/seed', protect, authorize('admin'), seedQuestions);
router.post('/generate', protect, generateQuestions);
router.post('/generate-phase2', protect, generatePhase2Questions);

module.exports = router;
