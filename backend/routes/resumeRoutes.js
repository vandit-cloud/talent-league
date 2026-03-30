const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeResume } = require('../controllers/resumeController');

// Configure Multer for file upload (memory storage for simplicity)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        console.log('📄 Multer file filter:', file.originalname, file.mimetype);
        // Accept PDFs and common document types
        const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedMimes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.pdf')) {
            cb(null, true);
        } else {
            console.log('❌ File type not allowed:', file.mimetype);
            cb(new Error('Only PDF and Word documents are allowed'), false);
        }
    }
});

// @route   POST /api/resume/analyze
// @desc    Upload and analyze resume using AI
// @access  Public
router.post('/analyze', (req, res, next) => {
    console.log('📥 Route /analyze hit - processing upload...');
    next();
}, upload.single('resume'), (err, req, res, next) => {
    if (err) {
        console.error('❌ Multer error:', err.message);
        return res.status(400).json({ message: err.message });
    }
    next();
}, analyzeResume);

module.exports = router;
