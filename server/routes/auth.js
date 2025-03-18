const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importing User model

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

        res.status(200).json({ success: true, token, user: { id: user._id, email: user.email } });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

module.exports = router;