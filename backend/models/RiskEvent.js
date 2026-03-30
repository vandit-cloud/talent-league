const mongoose = require('mongoose');

const riskEventSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  signalSource: { type: String, required: true },
  weight: { type: Number, required: true },
  scoreDelta: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RiskEvent', riskEventSchema);
