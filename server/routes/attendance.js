import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Classroom from '../models/Classroom.js';
import User from '../models/User.js';
import FormData from 'form-data'; // Import FormData for sending files

const router = express.Router();

// Configure multer for file uploads (memoryStorage is good for directly using buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

const FLASK_API_URL = process.env.PYTHON_API_URL; // From your .env

// Take attendance
router.post('/:classroomId/take', upload.single('file'), async (req, res) => {
    try {
        const { userId } = req.auth;
        const { classroomId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const classroom = await Classroom.findOne({
            classroomId,
            teacher: user._id,
            isActive: true
        });

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        if (!classroom.modelTrained) {
            return res.status(400).json({ message: 'Model not trained yet. Please train the model first.' });
        }

        // --- NEW: Prepare FormData for Flask API ---
        const formData = new FormData();
        // Append the image buffer directly. Multer memoryStorage provides req.file.buffer
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // Call Flask API for attendance taking (recognition)
        try {
            const flaskResponse = await axios.post(
                `http://localhost:8000/classroom/${classroomId}/recognize_faces`, // Updated Flask endpoint
                formData,
                {
                    headers: {
                        ...formData.getHeaders(), // Important for FormData
                    },
                    timeout: 60000 // 1 minute timeout
                }
            );

            const recognitionData = flaskResponse.data; // This is the data from Flask
            const recognizedFaces = recognitionData.recognized_faces || [];
            const resultImageUrl = recognitionData.image_url; // Path to the annotated image from Flask

            const sessionId = uuidv4().substring(0, 8);
            const attendanceResults = [];
            const presentRollNumbers = new Set(); // To track unique presents in this session

            for (const face of recognizedFaces) {
                // Ensure roll_number is not 'Unknown' and is unique for this session
                if (face.roll_number && face.roll_number !== 'Unknown' && !presentRollNumbers.has(face.roll_number)) {
                    attendanceResults.push({
                        rollNumber: face.roll_number,
                        confidence: face.confidence,
                        bbox: face.bbox,
                        status: 'present', // Assuming recognized means present
                        recognizedFaceImageUrl: `${FLASK_API_URL}${face.face_image_url}` // Full URL from Flask
                    });
                    presentRollNumbers.add(face.roll_number);
                } else if (face.roll_number === 'Unknown') {
                    // Optionally, store unknown faces
                    attendanceResults.push({
                        rollNumber: 'Unknown',
                        confidence: face.confidence,
                        bbox: face.bbox,
                        status: 'unknown',
                        recognizedFaceImageUrl: `${FLASK_API_URL}${face.face_image_url}`
                    });
                }
            }

            // Determine absent students by comparing classroom.students with presentRollNumbers
            // NOTE: classroom.students should contain objects with a `rollNumber` property
            const absentCount = classroom.students.filter(student => !presentRollNumbers.has(student.rollNumber)).length;
            const presentCount = presentRollNumbers.size;


            const attendanceSession = {
                sessionId,
                date: new Date(),
                totalStudents: classroom.students.length, // Use actual student count from your Classroom model
                presentCount: presentCount,
                absentCount: absentCount,
                attendanceImage: `${FLASK_API_URL}${resultImageUrl}`, // Full URL to the annotated image
                attendanceResults: attendanceResults,
                createdAt: new Date()
            };

            // Add to classroom
            classroom.attendanceSessions.push(attendanceSession);
            await classroom.save();

            res.json({
                message: 'Attendance recorded successfully',
                session: attendanceSession,
                resultImage: attendanceSession.attendanceImage // Use the full URL directly
            });
        } catch (flaskError) {
            console.error('Flask API error during attendance recognition:', flaskError.response ? flaskError.response.data : flaskError.message);
            res.status(flaskError.response?.status || 500).json({
                message: 'Failed to process attendance with face recognition service',
                error: flaskError.response?.data || flaskError.message
            });
        }
    } catch (error) {
        console.error('Take attendance error:', error);
        res.status(500).json({ message: 'Failed to take attendance' });
    }
});

// Get attendance history (no changes needed as it reads from MongoDB)
router.get('/:classroomId/history', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { classroomId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const classroom = await Classroom.findOne({
            classroomId,
            teacher: user._id,
            isActive: true
        });

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Get paginated attendance sessions
        const skip = (page - 1) * limit;
        const sessions = classroom.attendanceSessions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(skip, skip + parseInt(limit));

        const totalSessions = classroom.attendanceSessions.length;
        const totalPages = Math.ceil(totalSessions / limit);

        res.json({
            sessions,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalSessions,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Get attendance history error:', error);
        res.status(500).json({ message: 'Failed to get attendance history' });
    }
});

// Get attendance analytics (no changes needed as it reads from MongoDB)
router.get('/:classroomId/analytics', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { classroomId } = req.params;

        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const classroom = await Classroom.findOne({
            classroomId,
            teacher: user._id,
            isActive: true
        });

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const sessions = classroom.attendanceSessions;
        const totalSessions = sessions.length;

        if (totalSessions === 0) {
            return res.json({
                totalSessions: 0,
                averageAttendance: 0,
                attendanceTrend: [],
                studentAttendance: []
            });
        }

        // Calculate average attendance
        const totalPresent = sessions.reduce((sum, session) => sum + session.presentCount, 0);
        // Corrected calculation for average attendance to use classroom.students.length
        const averageAttendance = (totalSessions > 0 && classroom.students.length > 0)
            ? (totalPresent / (totalSessions * classroom.students.length)) * 100
            : 0;


        // Get attendance trend (last 10 sessions)
        const attendanceTrend = sessions
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .slice(-10)
            .map(session => ({
                date: session.createdAt,
                // Ensure classroom.students.length is used consistently
                percentage: (classroom.students.length > 0) ? (session.presentCount / classroom.students.length) * 100 : 0
            }));

        // Calculate individual student attendance
        const studentAttendance = classroom.students.map(student => {
            const presentCount = sessions.reduce((count, session) => {
                const studentRecord = session.attendanceResults.find(
                    // Ensure rollNumber comparison matches how it's stored
                    result => result.rollNumber === student.rollNumber && result.status === 'present'
                );
                return count + (studentRecord ? 1 : 0);
            }, 0);

            return {
                rollNumber: student.rollNumber,
                name: student.name, // Assuming student object in classroom.students has a 'name' field
                presentCount,
                totalSessions,
                percentage: totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0
            };
        });

        res.json({
            totalSessions,
            averageAttendance,
            attendanceTrend,
            studentAttendance
        });
    } catch (error) {
        console.error('Get attendance analytics error:', error);
        res.status(500).json({ message: 'Failed to get attendance analytics' });
    }
});

export default router;