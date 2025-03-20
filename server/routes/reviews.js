const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { auth } = require('../middleware/auth');

// @route   GET /api/reviews/movie/:movieId
// @desc    Get all reviews for a movie with pagination
// @access  Public
router.get('/movie/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const { page = 1, limit = 5 } = req.query;

        const reviews = await Review.find({ movie: movieId })
            .populate('user', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await Review.countDocuments({ movie: movieId });

        res.json({ reviews, total });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
});

// @route   POST /api/reviews/movie/:movieId
// @desc    Create a new review for a movie
// @access  Private
router.post('/movie/:movieId', auth, async (req, res) => {
    try {
        const { movieId } = req.params;
        const { rating, content } = req.body;
        const user = req.user.id; // From auth middleware

        // Validate input
        if (!rating || !content) {
            return res.status(400).json({ message: 'Rating and content are required' });
        }

        const review = new Review({
            user,
            movie: movieId,
            rating,
            content,
            likes: [],
        });

        await review.save();
        const populatedReview = await Review.findById(review._id).populate('user', 'username profilePicture');

        // Emit WebSocket event
        const io = req.app.get('socketio');
        io.to(movieId).emit('reviewAdded', populatedReview);

        res.status(201).json(populatedReview);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this movie' });
        }
        res.status(400).json({ message: 'Error creating review', error: error.message });
    }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private
router.put('/:reviewId', auth, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, content } = req.body;
        const user = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        if (review.user.toString() !== user) {
            return res.status(403).json({ message: 'Not authorized to update this review' });
        }

        review.rating = rating;
        review.content = content;
        await review.save();

        const populatedReview = await Review.findById(reviewId).populate('user', 'username profilePicture');

        // Emit WebSocket event
        const io = req.app.get('socketio');
        io.to(review.movie).emit('reviewUpdated', populatedReview);

        res.json(populatedReview);
    } catch (error) {
        res.status(400).json({ message: 'Error updating review', error: error.message });
    }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.delete('/:reviewId', auth, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const user = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        if (review.user.toString() !== user) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        const movieId = review.movie;
        await review.deleteOne();

        // Emit WebSocket event
        const io = req.app.get('socketio');
        io.to(movieId).emit('reviewDeleted', reviewId, movieId);

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review', error: error.message });
    }
});

// @route   PUT /api/reviews/like/:reviewId
// @desc    Like or unlike a review
// @access  Private
router.put('/like/:reviewId', auth, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const userIndex = review.likes.indexOf(userId);
        if (userIndex === -1) {
            review.likes.push(userId);
        } else {
            review.likes.splice(userIndex, 1);
        }

        await review.save();
        const populatedReview = await Review.findById(reviewId).populate('user', 'username profilePicture');

        // Emit WebSocket event
        const io = req.app.get('socketio');
        io.to(review.movie).emit('reviewUpdated', populatedReview);

        res.json(populatedReview);
    } catch (error) {
        res.status(500).json({ message: 'Error liking review', error: error.message });
    }
});

// @route   GET /api/reviews/user
// @desc    Get all reviews by the authenticated user
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 5 } = req.query;

        const reviews = await Review.find({ user: userId })
            .populate('user', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await Review.countDocuments({ user: userId });

        res.json({ reviews, total });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user reviews', error: error.message });
    }
});

module.exports = router;