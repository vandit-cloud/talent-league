const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const seeUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_portal');
        console.log('--- Current Users in Database ---');
        const users = await User.find({}, 'name email role createdAt');
        if (users.length === 0) {
            console.log('No users found.');
        } else {
            console.table(users.map(u => ({
                Name: u.name,
                Email: u.email,
                Role: u.role,
                Joined: u.createdAt
            })));
        }
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

seeUsers();
