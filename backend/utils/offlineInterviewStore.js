const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'interviews.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify([]));

const getAll = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; } };
const save = (data) => { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); };

const add = (interview) => {
    const all = getAll();
    const item = { ...interview, _id: `interview_${Date.now()}`, createdAt: new Date().toISOString() };
    all.push(item);
    save(all);
    return item;
};

const findByRecruiterId = (recruiterId) => getAll().filter(i => i.recruiterId === recruiterId);
const findByCandidateEmail = (email) => getAll().filter(i => i.candidateEmail?.toLowerCase() === email?.toLowerCase());
const findById = (id) => getAll().find(i => i._id === id);

const update = (id, updates) => {
    const all = getAll();
    const idx = all.findIndex(i => i._id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates };
    save(all);
    return all[idx];
};

const remove = (id) => {
    const all = getAll();
    save(all.filter(i => i._id !== id));
};

module.exports = { add, findByRecruiterId, findByCandidateEmail, findById, update, remove };
