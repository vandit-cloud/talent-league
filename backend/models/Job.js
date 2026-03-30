const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String }, // Can be provided or populated from recruiter
    department: { type: String, required: true },
    location: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['full-time', 'part-time', 'contract', 'internship'],
        default: 'full-time'
    },
    experience: { 
        type: String, 
        enum: ['entry', 'mid', 'senior', 'lead'],
        default: 'mid'
    },
    salary: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, default: 'USD' }
    },
    description: { type: String },
    requirements: [{ type: String }],
    status: { 
        type: String, 
        enum: ['active', 'closed', 'draft'],
        default: 'active'
    },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicants: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
