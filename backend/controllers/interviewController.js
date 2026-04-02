const Interview = require('../models/Interview');
const mongoose = require('mongoose');
const offlineStore = require('../utils/offlineInterviewStore');
const { sendHtmlEmail } = require('../utils/emailSender');

const isDbConnected = () => mongoose.connection.readyState === 1;

const buildInterviewEmailHtml = (interview) => `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px;">
        <div style="background: #ffffff; border-radius: 12px; padding: 32px;">
            <h1 style="margin: 0 0 8px; font-size: 22px; color: #1e1b4b;">Interview Scheduled</h1>
            <p style="margin: 0 0 20px; color: #64748b; font-size: 14px;">You have a new interview invitation from ${interview.company}.</p>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
                <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #1e1b4b;">${interview.jobTitle}</p>
                <p style="margin: 0 0 4px; font-size: 13px; color: #475569;">Date: <strong>${interview.date}</strong> at <strong>${interview.time}</strong></p>
                <p style="margin: 0 0 4px; font-size: 13px; color: #475569;">Duration: ${interview.duration}</p>
                <p style="margin: 0 0 4px; font-size: 13px; color: #475569;">Type: ${interview.type}</p>
                <p style="margin: 0 0 4px; font-size: 13px; color: #475569;">Round: ${interview.round}</p>
                ${interview.interviewer ? `<p style="margin: 0 0 4px; font-size: 13px; color: #475569;">Interviewer: ${interview.interviewer}</p>` : ''}
                ${interview.notes ? `<p style="margin: 8px 0 0; font-size: 13px; color: #64748b;"><em>${interview.notes}</em></p>` : ''}
            </div>
            <p style="margin: 0; color: #64748b; font-size: 12px;">Log in to TalentLeague to view details and join the meeting.</p>
        </div>
    </div>
`;

const createInterview = async (req, res) => {
    try {
        const { jobTitle, company, candidateEmail, candidateName, date, time, duration, type, round, interviewer, location, notes } = req.body;
        // SECURITY: Always use authenticated user's ID
        const recruiterId = req.user._id;

        if (!jobTitle || !candidateEmail || !date || !time) {
            return res.status(400).json({ message: 'Job title, candidate email, date, and time are required.' });
        }

        const data = { jobTitle, company, candidateEmail: candidateEmail.trim().toLowerCase(), candidateName, date, time, duration, type, round, interviewer, location, notes, recruiterId, status: 'upcoming' };

        let interview;
        if (isDbConnected()) {
            interview = await Interview.create(data);
        } else {
            interview = offlineStore.add(data);
        }

        // Send email to candidate
        try {
            await sendHtmlEmail({
                to: candidateEmail.trim().toLowerCase(),
                subject: `Interview Scheduled: ${jobTitle} at ${company}`,
                html: buildInterviewEmailHtml(interview)
            });
        } catch (emailErr) {
            console.error('Failed to send interview email:', emailErr.message);
        }

        res.status(201).json(interview);
    } catch (error) {
        res.status(500).json({ message: 'Error creating interview', error: error.message });
    }
};

const getInterviews = async (req, res) => {
    try {
        const { recruiterId, candidateEmail } = req.query;

        if (isDbConnected()) {
            const filter = {};
            if (recruiterId) filter.recruiterId = recruiterId;
            if (candidateEmail) filter.candidateEmail = candidateEmail.toLowerCase();
            const interviews = await Interview.find(filter).sort({ date: 1 });
            return res.json(interviews);
        }

        // Offline
        let interviews = [];
        if (recruiterId) interviews = offlineStore.findByRecruiterId(recruiterId);
        else if (candidateEmail) interviews = offlineStore.findByCandidateEmail(candidateEmail);
        interviews.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching interviews', error: error.message });
    }
};

const updateInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (isDbConnected()) {
            const existing = await Interview.findById(id);
            if (!existing) return res.status(404).json({ message: 'Interview not found' });

            // SECURITY: Verify ownership
            if (req.user.role !== 'admin' && String(existing.recruiterId) !== String(req.user._id)) {
                return res.status(403).json({ message: 'You can only update your own interviews.' });
            }

            const interview = await Interview.findByIdAndUpdate(id, updates, { new: true });
            return res.json(interview);
        }

        const interview = offlineStore.update(id, updates);
        if (!interview) return res.status(404).json({ message: 'Interview not found' });
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: 'Error updating interview', error: error.message });
    }
};

const deleteInterview = async (req, res) => {
    try {
        const { id } = req.params;

        if (isDbConnected()) {
            const interview = await Interview.findById(id);
            if (!interview) {
                return res.status(404).json({ message: 'Interview not found' });
            }

            // SECURITY: Verify ownership
            if (req.user.role !== 'admin' && String(interview.recruiterId) !== String(req.user._id)) {
                return res.status(403).json({ message: 'You can only delete your own interviews.' });
            }

            await Interview.findByIdAndDelete(id);
        } else {
            offlineStore.remove(id);
        }

        res.json({ message: 'Interview deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting interview', error: error.message });
    }
};

module.exports = { createInterview, getInterviews, updateInterview, deleteInterview };
