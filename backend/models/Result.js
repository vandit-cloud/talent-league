const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    description: { type: String, required: true },
});

const resultSchema = new mongoose.Schema({
    candidateName: { type: String, default: 'Anonymous' },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    answers: { type: Map, of: Number },
    violations: [violationSchema],
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Result', resultSchema);
