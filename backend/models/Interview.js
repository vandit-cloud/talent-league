const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    candidateName: { type: String },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: String, default: '45 min' },
    type: {
        type: String,
        enum: ['video', 'phone', 'in-person'],
        default: 'video'
    },
    status: {
        type: String,
        enum: ['upcoming', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    round: { type: String, default: 'Interview Round' },
    interviewer: { type: String },
    location: { type: String },
    notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
