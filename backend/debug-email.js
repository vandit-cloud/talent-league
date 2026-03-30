const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function debugEmail() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_portal';

    console.log('--- Email Config ---');
    console.log('USER:', emailUser);
    console.log('PASS:', emailPass ? '********' : 'MISSING');

    console.log('\n--- Testing SMTP ---');
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        await transporter.verify();
        console.log('✅ SMTP Connection verified successfully');
        
        console.log('\n--- Sending Test Email to yourself ---');
        const info = await transporter.sendMail({
            from: emailUser,
            to: emailUser,
            subject: 'TalentLeague SMTP Test',
            text: 'If you see this, your SMTP configuration is working perfectly.'
        });
        console.log('📬 Handover successful! Info:', info.response);
    } catch (err) {
        console.error('❌ SMTP Connection failed:', err.message);
    }

    console.log('\n--- Checking MongoDB for latest MCQ Test ---');
    try {
        await mongoose.connect(mongoUri);
        
        // Dynamic model definition to avoid needing the actual model file
        const MCQSchema = new mongoose.Schema({}, { strict: false });
        const MCQTest = mongoose.models.MCQTest || mongoose.model('MCQTest', MCQSchema, 'mcqtests');

        const latestTest = await MCQTest.findOne().sort({ createdAt: -1 });
        
        if (latestTest) {
            console.log('✅ Found latest test:');
            console.log('Candidate:', latestTest.candidateName, '<' + latestTest.candidateEmail + '>');
            console.log('Status:', latestTest.status);
            console.log('Token:', latestTest.testToken);
            console.log('Created At:', latestTest.createdAt);
            
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            console.log('\n🔗 Direct Link:', `${frontendUrl}/mcq-test/${latestTest.testToken}`);
        } else {
            console.log('❌ No MCQ tests found in database.');
        }

    } catch (err) {
        console.error('❌ MongoDB error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

debugEmail();
