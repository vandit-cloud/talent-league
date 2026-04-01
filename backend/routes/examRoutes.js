const express = require('express');
const router = express.Router();
const { getQuestions, submitResult, seedQuestions, generateQuestions, generatePhase2Questions } = require('../controllers/examController');

// Routes
router.get('/questions', getQuestions);
router.post('/submit', submitResult);
router.post('/seed', seedQuestions);
router.post('/generate', generateQuestions);
router.post('/generate-phase2', generatePhase2Questions);

module.exports = router;
