const express = require('express');
const router = express.Router();
const {
  createSession,
  recordViolation,
  recordRiskEvent,
  updateRiskScore,
  getSession,
  heartbeat,
} = require('../controllers/proctoringController');
const { protect } = require('../middleware/auth');

router.post('/sessions', protect, createSession);
router.get('/sessions/:sessionId', protect, getSession);
router.post('/sessions/:sessionId/risk', protect, updateRiskScore);
router.post('/violations', protect, recordViolation);
router.post('/risk-events', protect, recordRiskEvent);
router.post('/heartbeat', protect, heartbeat);

module.exports = router;
