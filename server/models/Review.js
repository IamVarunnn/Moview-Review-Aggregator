const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
    },
    movie: {
        type: String,
        required: [true, 'Movie ID is required'],
        index: true, // Add index for faster queries by movie
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'], // Adjusted to match frontend (1-5 scale)
    },
    content: {
        type: String,
        required: [true, 'Review content is required'],
        minlength: [5, 'Review content must be at least 5 characters long'],
        maxlength: [1000, 'Review content cannot exceed 1000 characters'],
        trim: true, // Remove leading/trailing whitespace
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt field before saving
ReviewSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for efficient sorting by createdAt
ReviewSchema.index({ createdAt: -1 });

// Ensure a user can only review a movie once
ReviewSchema.index({ user: 1, movie: 1 }, { unique: true });

// Method to check if a user has liked the review
ReviewSchema.methods.hasLiked = function (userId) {
    return this.likes.includes(userId);
};

module.exports = mongoose.model('Review', ReviewSchema);