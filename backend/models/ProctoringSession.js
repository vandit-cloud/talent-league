const mongoose = require('mongoose');

const proctoringSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'warning', 'suspended', 'terminated', 'completed'],
    default: 'active',
  },
  baselineRiskScore: { type: Number, default: 0 },
  currentRiskScore: { type: Number, default: 0 },
  referenceImagesEncrypted: { type: String },
  signedToken: { type: String },
});

module.exports = mongoose.model('ProctoringSession', proctoringSessionSchema);
