const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    type: { type: String, enum: ['mcq', 'coding', 'logic', 'syntax'], default: 'mcq' },
    correctAnswer: { type: Number, required: true },
    skill: { type: String },
    difficulty: { type: String, enum: ['basic', 'intermediate', 'advanced'], default: 'intermediate' }
});

module.exports = mongoose.model('Question', questionSchema);
