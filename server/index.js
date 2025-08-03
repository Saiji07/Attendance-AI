

import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import mongoose from 'mongoose';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';



import authRoutes from './routes/auth.js';
import classroomRoutes from './routes/classrooms.js';
import attendanceRoutes from './routes/attendance.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// CORRECTED: Use environment variable for frontend URL
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// MongoDB connection
const connectDB = async () => {
    try {
        // Removed deprecated options for modern Mongoose versions
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
    }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', ClerkExpressRequireAuth(), classroomRoutes);
app.use('/api/attendance', ClerkExpressRequireAuth(), attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        pythonApiUrl: process.env.PYTHON_API_URL,
        mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Test Python API connection
app.get('/api/test-python', async (req, res) => {
    try {
        const axios = (await import('axios')).default;
        const response = await axios.get(`${process.env.PYTHON_API_URL}/api/health`);
        res.json({
            message: 'Python API connection successful',
            pythonApiStatus: response.data
        });
    } catch (error) {
        res.status(500).json({
            message: 'Python API connection failed',
            error: error.message,
            pythonApiUrl: process.env.PYTHON_API_URL
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err.message === 'Unauthenticated') {
        return res.status(401).json({ 
            message: 'Authentication required', 
            error: 'Please sign in to access this resource' 
        });
    }
    
    res.status(500).json({ message: 'Server error', error: err.message });
});

app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Node.js Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Python API URL: ${process.env.PYTHON_API_URL}`);
    console.log(`MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
});
