const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    skill: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] }
});

const mcqTestSchema = new mongoose.Schema({
    candidateEmail: { type: String, required: true },
    candidateName: { type: String, required: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assessmentId: { type: String },
    assessmentTitle: { type: String },
    requiredSkills: [{ type: String }],
    resumeData: { type: mongoose.Schema.Types.Mixed },
    testLink: { type: String, required: true, unique: true },
    testToken: { type: String, required: true, unique: true },
    questions: [questionSchema],
    submittedAnswers: [{ type: Number }],
    duration: { type: Number, default: 30 },
    status: { 
        type: String, 
        enum: ['pending', 'sent', 'started', 'completed', 'expired'], 
        default: 'pending' 
    },
    sentAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    score: { type: Number },
    totalQuestions: { type: Number },
    correctAnswers: { type: Number },
    phase2Submission: { type: mongoose.Schema.Types.Mixed },
    proctoringViolations: [{ type: String }],
    cameraSnapshots: [{ type: String }],
    testPhase: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('MCQTest', mcqTestSchema);
