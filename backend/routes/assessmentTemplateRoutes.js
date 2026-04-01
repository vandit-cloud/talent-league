const express = require('express');
const router = express.Router();
const { createTemplate, getTemplates, deleteTemplate } = require('../controllers/assessmentTemplateController');

router.post('/', createTemplate);
router.get('/', getTemplates);
router.delete('/:id', deleteTemplate);

module.exports = router;
