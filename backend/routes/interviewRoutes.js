const express = require('express');
const router = express.Router();
const { createInterview, getInterviews, updateInterview, deleteInterview } = require('../controllers/interviewController');
const { protect, authorize, requireVerified } = require('../middleware/auth');

router.post('/', protect, authorize('recruiter', 'admin'), requireVerified, createInterview);
router.get('/', protect, getInterviews);
router.put('/:id', protect, authorize('recruiter', 'admin'), requireVerified, updateInterview);
router.delete('/:id', protect, authorize('recruiter', 'admin'), requireVerified, deleteInterview);

module.exports = router;
