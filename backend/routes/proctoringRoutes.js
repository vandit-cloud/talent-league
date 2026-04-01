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

router.post('/sessions', createSession);
router.get('/sessions/:sessionId', getSession);
router.post('/sessions/:sessionId/risk', updateRiskScore);
router.post('/violations', recordViolation);
router.post('/risk-events', recordRiskEvent);
router.post('/heartbeat', heartbeat);

module.exports = router;
