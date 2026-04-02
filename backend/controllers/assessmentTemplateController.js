const AssessmentTemplate = require('../models/AssessmentTemplate');

const createTemplate = async (req, res) => {
    try {
        const { name, role, type, skills, rounds, minScore, description } = req.body;
        // SECURITY: Always use authenticated user's ID
        const recruiterId = req.user._id;
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
        const template = await AssessmentTemplate.findById(id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // SECURITY: Verify ownership
        if (req.user.role !== 'admin' && String(template.recruiterId) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You can only delete your own templates.' });
        }

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
