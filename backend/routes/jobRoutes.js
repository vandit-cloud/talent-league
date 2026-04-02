const express = require('express');
const router = express.Router();
const { createJob, getJobs, deleteJob } = require('../controllers/jobController');
const { protect, authorize, requireVerified } = require('../middleware/auth');

router.post('/', protect, authorize('recruiter', 'admin'), requireVerified, createJob);
router.get('/', protect, getJobs);
router.delete('/:id', protect, authorize('recruiter', 'admin'), requireVerified, deleteJob);

module.exports = router;
