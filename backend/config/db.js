const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_portal');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`⚠️ MongoDB Connection Failed: ${error.message}`);
        console.log('Running in "offline" mode (API endpoints will return error but server will stay up)');
    }
};

module.exports = connectDB;
