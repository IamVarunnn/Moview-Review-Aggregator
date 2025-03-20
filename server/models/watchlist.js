const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const watchlistSchema = new Schema(
    {
        userId: {
            type: String,
            required: [true, 'User ID is required'],
            trim: true,
        },
        mediaId: {
            type: Number,
            required: [true, 'Media ID is required'],
        },
        mediaType: {
            type: String,
            enum: {
                values: ['movie', 'tv'],
                message: 'Media type must be either "movie" or "tv"',
            },
            required: [true, 'Media type is required'],
        },
        title: {
            type: String,
            trim: true,
        },
        poster_path: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Compound index to prevent duplicate watchlist items for the same user and media
watchlistSchema.index({ userId: 1, mediaId: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);