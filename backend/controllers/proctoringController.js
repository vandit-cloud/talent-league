const ProctoringSession = require('../models/ProctoringSession');
const Violation = require('../models/Violation');
const RiskEvent = require('../models/RiskEvent');

const createSession = async (req, res) => {
  try {
    const session = new ProctoringSession(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const recordViolation = async (req, res) => {
  try {
    const violation = new Violation(req.body);
    await violation.save();
    res.status(201).json(violation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const recordRiskEvent = async (req, res) => {
  try {
    const event = new RiskEvent(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateRiskScore = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { currentRiskScore, status } = req.body;
    const session = await ProctoringSession.findOneAndUpdate(
      { sessionId },
      { currentRiskScore, status },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSession = async (req, res) => {
  try {
    const session = await ProctoringSession.findOne({ sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const heartbeat = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await ProctoringSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ ok: true, status: session.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createSession,
  recordViolation,
  recordRiskEvent,
  updateRiskScore,
  getSession,
  heartbeat,
};
