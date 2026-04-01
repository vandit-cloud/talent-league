const mongoose = require('mongoose');

const identitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        type: String,
        enum: ['google', 'microsoft', 'github', 'linkedin'],
        required: true
    },
    providerUserId: {
        type: String,
        required: true
    },
    emailFromProvider: {
        type: String,
        lowercase: true
    },
    emailVerifiedByProvider: {
        type: Boolean,
        default: false
    },
    scopesGranted: [String],
    tokens: {
        accessToken: String,
        refreshToken: String,
        expiresAt: Date
    },
    profileSnapshot: {
        name: String,
        avatar: String,
        raw: Object
    },
    lastSyncAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure uniqueness per provider per user
identitySchema.index({ provider: 1, providerUserId: 1 }, { unique: true });

module.exports = mongoose.model('Identity', identitySchema);
