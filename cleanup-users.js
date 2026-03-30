const mongoose = require('mongoose');
const User = require('./backend/models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/resume-ai')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Delete test users
    const result = await User.deleteMany({
      email: { $in: ['recruiter@test.com', 'newrecruiter@test.com', 'frontend@test.com'] }
    });
    
    console.log(`Deleted ${result.deletedCount} test users`);
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
