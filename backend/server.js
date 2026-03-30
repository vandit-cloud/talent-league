const express = require('express');
const cors = require('cors');
const axios = require("axios");
const { OAuth2Client } = require('google-auth-library');
const connectDB = require('./config/db');
const { getRuntimePublicUrls } = require('./utils/runtimeConfig');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

const client = new OAuth2Client(
    "222922228938-7h7qidkkibnntepkei225gb8v34sid0t.apps.googleusercontent.com"
);

// Connect to Database
connectDB();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://192.168.1.16:5173',
            'capacitor://localhost',
            'http://localhost',
            'ionic://localhost'
        ];

        // Allow any localhost origin (for Capacitor)
        if (origin.includes('localhost') || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for now to debug
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Basic Route
app.get('/', (req, res) => {
    res.send('Exam Portal API is running...');
});

// App redirect route for deep linking
app.get('/open-app/:token', (req, res) => {
    res.sendFile(__dirname + '/public/app-redirect.html');
});

// Test route
app.get('/test', (req, res) => {
    console.log('Test route hit from:', req.headers['user-agent']?.substring(0, 50));
    res.json({
        message: 'Backend is working',
        time: new Date().toISOString(),
        groq_key: process.env.GROQ_API_KEY ? 'Present' : 'Missing',
        gemini_key: process.env.GEMINI_API_KEY ? 'Present' : 'Missing',
        cors_origin: req.headers.origin || 'No origin header'
    });
});

// Diagnostic route for mobile app
app.get('/diagnostic', (req, res) => {
    console.log('📱 Diagnostic check from:', req.headers['user-agent']);
    const { backendUrl, frontendUrl } = getRuntimePublicUrls();
    res.json({
        status: 'OK',
        backend_url: backendUrl,
        frontend_url: frontendUrl,
        timestamp: new Date().toISOString(),
        origin: req.headers.origin,
        user_agent: req.headers['user-agent']
    });
});

// Authentication Routes are handled via app.use('/api/auth', ...) below

// Routes
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resume', require('./routes/resumeRoutes'));
app.use('/api/proctoring', require('./routes/proctoringRoutes'));
app.use('/api/mcq', require('./routes/mcqRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/assessment-templates', require('./routes/assessmentTemplateRoutes'));

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
