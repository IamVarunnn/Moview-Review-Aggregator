const express = require('express');
const router = express.Router();
// const Watchlist = require('../models/watchlist');
const { auth } = require('../middleware/auth'); // Import the auth middleware

// POST /api/watchlist - Add item to watchlist
router.post('/', auth, async (req, res) => {
    try {
        const { mediaId, mediaType, title, poster_path } = req.body;
        const userId = req.user.userId; // Guaranteed to exist due to auth middleware

        // Validate required fields
        if (!mediaId || !mediaType) {
            return res.status(400).json({ message: 'mediaId and mediaType are required' });
        }

        // Validate mediaType
        if (!['movie', 'tv'].includes(mediaType)) {
            return res.status(400).json({ message: 'mediaType must be either "movie" or "tv"' });
        }

        // Validate mediaId is a positive number
        if (!Number.isInteger(mediaId) || mediaId <= 0) {
            return res.status(400).json({ message: 'mediaId must be a positive integer' });
        }

        // Check if the item already exists in the watchlist
        const existingItem = await Watchlist.findOne({ userId, mediaId, mediaType });
        if (existingItem) {
            return res.status(400).json({ message: 'Item already in watchlist' });
        }

        // Create new watchlist item
        const newWatchlistItem = new Watchlist({
            userId,
            mediaId,
            mediaType,
            title,
            poster_path,
        });

        await newWatchlistItem.save();
        res.status(201).json({ success: true, message: 'Added to watchlist', data: newWatchlistItem });
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Item already in watchlist' });
        }
        res.status(500).json({ message: 'Server error while adding to watchlist', error: error.message });
    }
});

// GET /api/watchlist - Retrieve user's watchlist
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const watchlistItems = await Watchlist.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: watchlistItems });
    } catch (error) {
        console.error('Error retrieving watchlist:', error);
        res.status(500).json({ message: 'Server error while retrieving watchlist', error: error.message });
    }
});

// DELETE /api/watchlist/:mediaId - Remove item from watchlist
router.delete('/:mediaId', auth, async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { mediaType } = req.query; // mediaType passed as query parameter
        const userId = req.user.userId;

        // Validate mediaId
        const parsedMediaId = parseInt(mediaId, 10);
        if (isNaN(parsedMediaId) || parsedMediaId <= 0) {
            return res.status(400).json({ message: 'mediaId must be a positive integer' });
        }

        // Validate mediaType
        if (!mediaType || !['movie', 'tv'].includes(mediaType)) {
            return res.status(400).json({ message: 'mediaType must be either "movie" or "tv" and is required' });
        }

        // Find and delete the watchlist item
        const deletedItem = await Watchlist.findOneAndDelete({
            userId,
            mediaId: parsedMediaId,
            mediaType,
        });

        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found in watchlist' });
        }

        res.status(200).json({ success: true, message: 'Item removed from watchlist', data: deletedItem });
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        res.status(500).json({ message: 'Server error while removing from watchlist', error: error.message });
    }
});

module.exports = router;