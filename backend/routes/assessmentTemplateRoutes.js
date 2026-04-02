const express = require('express');
const router = express.Router();
const { createTemplate, getTemplates, deleteTemplate } = require('../controllers/assessmentTemplateController');
const { protect, authorize, requireVerified } = require('../middleware/auth');

router.post('/', protect, authorize('recruiter', 'admin'), requireVerified, createTemplate);
router.get('/', protect, getTemplates);
router.delete('/:id', protect, authorize('recruiter', 'admin'), requireVerified, deleteTemplate);

module.exports = router;
