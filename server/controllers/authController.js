import User, { findOne, findById } from '../models/User';
import { sign } from 'jsonwebtoken';

// Register a new user
export async function register(req, res) {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        let user = await findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check if username is taken
        user = await findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        // Create new user
        user = new User({
            username,
            email,
            password
        });

        // Save user to database
        await user.save();

        // Create JWT token
        const payload = {
            id: user.id
        };

        sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        profilePicture: user.profilePicture,
                        isAdmin: user.isAdmin
                    }
                });
            }
        );
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
}

// Login user
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const payload = {
            id: user.id
        };

        sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        profilePicture: user.profilePicture,
                        isAdmin: user.isAdmin
                    }
                });
            }
        );
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
}

// Get current user
export async function getCurrentUser(req, res) {
    try {
        const user = await findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
} 