const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login route (already working)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const emailLower = email.toLowerCase();
        console.log('Login attempt with email:', emailLower);

        const user = await User.findOne({ email: { $regex: new RegExp(`^${emailLower}$`, 'i') } });
        console.log('User found:', user ? 'Yes' : 'No', user ? { _id: user._id, email: user.email } : null);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful, token generated');

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username, // Added to match frontend expectation
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

// Register route (new)
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        const emailLower = email.toLowerCase();
        console.log('Register attempt with:', { username, email: emailLower, password });

        // Check if user already exists (by email or username)
        const existingUser = await User.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${emailLower}$`, 'i') } },
                { username: { $regex: new RegExp(`^${username}$`, 'i') } },
            ],
        });
        if (existingUser) {
            console.log('User already exists:', { email: emailLower, username });
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        // Create new user
        const user = new User({
            username,
            email: emailLower,
            password, // Password will be hashed by pre-save hook
        });

        // Save user to database
        await user.save();
        console.log('User registered successfully:', { _id: user._id, email: user.email, username: user.username });

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Registration successful, token generated');

        // Send response
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

module.exports = router;