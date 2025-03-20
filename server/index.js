const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http'); // Required for Socket.IO
const { Server } = require('socket.io'); // Import Socket.IO

const user = require('./models/User');

// Load environment variables
dotenv.config();

// Clear Mongoose model cache to prevent redefinition during hot-reloading
mongoose.models = {};
mongoose.modelSchemas = {};

// Initialize Express app
const app = express();
const server = http.createServer(app); // Create HTTP server for Socket.IO
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:3000', // Frontend local dev
            'https://movie-review-aggregator.vercel.app', // Deployed frontend
            process.env.FRONTEND_URL || '',
        ].filter(Boolean),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    },
});

// Middleware
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000', // Frontend local dev
            'https://movie-review-aggregator.vercel.app', // Deployed frontend
            process.env.FRONTEND_URL || '', // Environment variable for flexibility
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin)) {
            console.log('CORS allowed for origin:', origin);
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.options('*', cors(corsOptions)); // Handle preflight requests for all routes
app.use(cors(corsOptions)); // Apply CORS to all routes
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const reviewRoutes = require('./routes/reviews');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/reviews', require('./routes/reviews'));
// Default route
app.get('/', (req, res) => {
    res.send('Movie Review Aggregator API is running');
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a movie room
    socket.on('joinMovie', (movieId) => {
        socket.join(movieId);
        console.log(`User ${socket.id} joined movie room: ${movieId}`);
    });

    // Broadcast new review to all clients in the movie room
    socket.on('reviewAdded', (movieId, review) => {
        io.to(movieId).emit('reviewAdded', review);
        console.log(`New review added for movie ${movieId}:`, review);
    });

    // Broadcast updated review
    socket.on('reviewUpdated', (updatedReview) => {
        io.to(updatedReview.movie).emit('reviewUpdated', updatedReview);
        console.log(`Review updated for movie ${updatedReview.movie}:`, updatedReview);
    });

    // Broadcast review deletion
    socket.on('reviewDeleted', (reviewId, movieId) => {
        io.to(movieId).emit('reviewDeleted', reviewId);
        console.log(`Review deleted: ${reviewId} for movie ${movieId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', {
            message: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
};

// Set port to 5000 to match frontend expectation
const PORT = process.env.PORT || 5000;

// Start server only after DB connection
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Closing server...');
            server.close(async () => {
                console.log('Server closed. Disconnecting from MongoDB...');
                await mongoose.connection.close();
                console.log('MongoDB connection closed.');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received. Closing server...');
            server.close(async () => {
                console.log('Server closed. Disconnecting from MongoDB...');
                await mongoose.connection.close();
                console.log('MongoDB connection closed.');
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('Failed to start server:', {
            message: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
};

// Start the server
startServer();