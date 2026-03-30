const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  type: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  description: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Violation', violationSchema);
