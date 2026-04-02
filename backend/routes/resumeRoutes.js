const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeResume } = require('../controllers/resumeController');

// Configure Multer for file upload (memory storage for simplicity)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedMimes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and Word documents are allowed'), false);
        }
    }
});

const { protect } = require('../middleware/auth');

// @route   POST /api/resume/analyze
// @desc    Upload and analyze resume using AI
// @access  Private
router.post('/analyze', protect, upload.single('resume'), (err, req, res, next) => {
    if (err) {
        console.error('❌ Multer error:', err.message);
        return res.status(400).json({ message: err.message });
    }
    next();
}, analyzeResume);

module.exports = router;
