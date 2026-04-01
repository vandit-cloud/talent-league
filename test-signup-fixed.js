const http = require('http');

// Test signup with unique email
const timestamp = Date.now();
const postData = JSON.stringify({
    name: 'Frontend Fixed Test',
    email: `fixed${timestamp}@test.com`,
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
        const response = JSON.parse(data);
        console.log('Response:', response);
        
        if (res.statusCode === 201) {
            console.log('✅ REGISTRATION WORKING!');
            console.log('🎯 Frontend should now work for recruiter signup!');
            console.log('📧 Test Email:', `fixed${timestamp}@test.com`);
            console.log('🔑 Password: test123');
        } else {
            console.log('❌ Registration failed:', response.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
});

req.write(postData);
req.end();
