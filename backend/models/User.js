const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    password: {
        type: String,
        required: function () {
            // Password only required if no social identities are linked and it's not a legacy user
            return !this.isSocialOnly;
        },
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['candidate', 'recruiter', 'admin'],
        default: 'candidate',
    },
    avatar: String,
    title: String,
    company: String,
    phone: String,
    location: String,
    // Recruiter company verification fields
    companyName: {
        type: String,
        trim: true,
    },
    gstNumber: {
        type: String,
        uppercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // optional
                return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
            },
            message: 'Invalid GST number format. Expected format: 22AAAAA0000A1Z5'
        }
    },
    cinNumber: {
        type: String,
        uppercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true;
                return /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(v);
            },
            message: 'Invalid CIN number format. Expected format: U12345MH2020PTC123456'
        }
    },
    udyamNumber: {
        type: String,
        uppercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true;
                return /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(v);
            },
            message: 'Invalid UDYAM number format. Expected format: UDYAM-MH-00-0000000'
        }
    },
    companyVerified: {
        type: Boolean,
        default: false,
    },
    verificationStatus: {
        type: String,
        enum: ['not_required', 'pending', 'verified', 'rejected'],
        default: 'not_required',
    },
    verificationNote: String,
    verifiedAt: Date,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isSocialOnly: {
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    signupOtpToken: String,
    signupOtpExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for identities
userSchema.virtual('identities', {
    ref: 'Identity',
    localField: '_id',
    foreignField: 'userId'
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
