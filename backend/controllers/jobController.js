const Job = require('../models/Job');
const mongoose = require('mongoose');
const offlineJobStore = require('../utils/offlineJobStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const createJob = async (req, res) => {
    try {
        const { title, company, department, location, type, experience, salary, description, requirements, recruiterId } = req.body;

        if (isDbConnected()) {
            const job = new Job({ title, company, department, location, type, experience, salary, description, requirements, recruiterId });
            await job.save();
            return res.status(201).json(job);
        }

        // Offline mode
        const job = offlineJobStore.addJob({ title, company, department, location, type, experience, salary, description, requirements, recruiterId });
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: 'Error creating job', error: error.message });
    }
};

const getJobs = async (req, res) => {
    try {
        if (isDbConnected()) {
            const { recruiterId } = req.query;
            const filter = recruiterId ? { recruiterId } : { status: 'active' };
            const jobs = await Job.find(filter)
                .populate('recruiterId', 'company')
                .sort({ createdAt: -1 });
            return res.json(jobs);
        }

        // Offline mode
        console.log('Using offline job store');
        const allJobs = offlineJobStore.getJobs();
        const { recruiterId } = req.query;
        const filtered = recruiterId
            ? allJobs.filter(j => j.recruiterId === recruiterId)
            : allJobs.filter(j => j.status === 'active');
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs', error: error.message });
    }
};

const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        if (isDbConnected()) {
            await Job.findByIdAndDelete(id);
            return res.json({ message: 'Job deleted successfully' });
        }

        offlineJobStore.deleteJob(id);
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting job', error: error.message });
    }
};

module.exports = { createJob, getJobs, deleteJob };
