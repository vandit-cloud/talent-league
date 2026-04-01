const http = require('http');

// Test with a unique email
const timestamp = Date.now();
const postData = JSON.stringify({
    name: 'Final Test Recruiter',
    email: `recruiter${timestamp}@test.com`,
    password: 'test123',
    role: 'recruiter'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', JSON.parse(data));
        
        if (res.statusCode === 201) {
            console.log('✅ Recruiter registration SUCCESSFUL!');
            console.log('📧 Email:', `recruiter${timestamp}@test.com`);
            console.log('🔑 Password: test123');
            console.log('👤 Role: recruiter');
        } else {
            console.log('❌ Registration failed');
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
