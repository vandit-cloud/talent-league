const axios = require('axios');

// Backend URL (adjust if needed)
const BACKEND_URL = 'http://localhost:5000';

// Test data
const testData = {
    candidateEmail: 'test@example.com',
    candidateName: 'John Doe',
    skills: [
        { name: 'JavaScript', category: 'Programming', proficiency: 'Advanced' },
        { name: 'React', category: 'Framework', proficiency: 'Expert' },
        { name: 'Node.js', category: 'Backend', proficiency: 'Advanced' }
    ]
};

async function testSendMCQ() {
    try {
        console.log('🚀 Testing MCQ creation and sending...\n');
        console.log('📧 Candidate:', testData.candidateName, '-', testData.candidateEmail);
        console.log('🎯 Skills:', testData.skills.map(s => s.name).join(', '));
        console.log('\n⏳ Sending request to backend...\n');

        const response = await axios.post(`${BACKEND_URL}/api/mcq/create`, testData);

        console.log('✅ SUCCESS!\n');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.testLink) {
            console.log('\n🔗 Test Link:', response.data.testLink);
        }

        if (response.data.previewUrl) {
            console.log('📧 Email Preview:', response.data.previewUrl);
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);

        if (error.response) {
            console.error('\n📋 Response Status:', error.response.status);
            console.error('📋 Response Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('\n⚠️  No response received from server.');
            console.error('   Make sure the backend is running on', BACKEND_URL);
            console.error('   Run: cd backend && npm start');
        } else {
            console.error('\n⚠️  Error details:', error.message);
        }
    }
}

// Run the test
testSendMCQ();
