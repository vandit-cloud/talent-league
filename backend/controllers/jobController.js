const Job = require('../models/Job');

const createJob = async (req, res) => {
    try {
        const { title, company, department, location, type, experience, salary, description, requirements, recruiterId } = req.body;
        const job = new Job({
            title,
            company,
            department,
            location,
            type,
            experience,
            salary,
            description,
            requirements,
            recruiterId
        });
        await job.save();
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: 'Error creating job', error: error.message });
    }
};

const getJobs = async (req, res) => {
    try {
        const { recruiterId } = req.query;
        const filter = recruiterId ? { recruiterId } : { status: 'active' };
        const jobs = await Job.find(filter)
            .populate('recruiterId', 'company')
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs', error: error.message });
    }
};

const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        await Job.findByIdAndDelete(id);
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting job', error: error.message });
    }
};

module.exports = {
    createJob,
    getJobs,
    deleteJob
};
