const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        // Get token from Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: Token missing' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token payload:', decoded); // Log the payload for debugging
        if (!decoded.userId) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token payload (missing userId)' });
        }

        // Find user by ID
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }

        // Attach user info to req.user (consistent with /routes/watchlist.js)
        req.user = {
            userId: user._id.toString(), // Convert ObjectId to string
        };

        next();
    } catch (error) {
        console.error('Token verification error:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
        });
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token has expired' });
        }
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

// Middleware to check if user is admin
const admin = async (req, res, next) => {
    try {
        // Fetch the user using req.user.userId
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }

        if (user.isAdminUser && user.isAdminUser()) { // Check if isAdminUser exists and is true
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Admin privileges required' });
        }
    } catch (error) {
        console.error('Admin middleware error:', {
            message: error.message,
            stack: error.stack,
        });
        res.status(500).json({ message: 'Server error while checking admin privileges' });
    }
};

module.exports = { auth, admin };