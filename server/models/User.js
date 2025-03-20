const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true, // Ensure email is stored in lowercase
        trim: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true, // Ensure username is stored in lowercase
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    profilePicture: {
        type: String,
        default: '',
    },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Update updatedAt field on save
userSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Export the model, reusing it if it already exists
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;