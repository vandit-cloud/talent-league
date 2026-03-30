const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function clearDatabase() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_portal';

    console.log('🧹 Starting database cleanup...');
    console.log('URI:', mongoUri);

    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections.`);

        for (const collection of collections) {
            const name = collection.name;
            console.log(`🗑️ Clearing collection: ${name}`);
            await mongoose.connection.db.collection(name).deleteMany({});
        }

        console.log('\n✨ Database cleared successfully! All memory has been reset.');

    } catch (err) {
        console.error('❌ Cleanup failed:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

clearDatabase();
