const mongoose = require('mongoose');

const assessmentTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['scratch', 'clone', 'ai-generated'],
        default: 'scratch'
    },
    skills: [{ type: String }],
    rounds: { type: Number, default: 1 },
    minScore: { type: Number, default: 70 },
    status: { 
        type: String, 
        enum: ['draft', 'active', 'archived'],
        default: 'active'
    },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AssessmentTemplate', assessmentTemplateSchema);
