const AssessmentTemplate = require('../models/AssessmentTemplate');

const createTemplate = async (req, res) => {
    try {
        const { name, role, type, skills, rounds, minScore, recruiterId, description } = req.body;
        const template = new AssessmentTemplate({
            name,
            role,
            type,
            skills,
            rounds,
            minScore,
            recruiterId,
            description
        });
        await template.save();
        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ message: 'Error creating template', error: error.message });
    }
};

const getTemplates = async (req, res) => {
    try {
        const { recruiterId } = req.query;
        const filter = recruiterId ? { recruiterId } : {};
        const templates = await AssessmentTemplate.find(filter).sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching templates', error: error.message });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await AssessmentTemplate.findByIdAndDelete(id);
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting template', error: error.message });
    }
};

module.exports = {
    createTemplate,
    getTemplates,
    deleteTemplate
};
