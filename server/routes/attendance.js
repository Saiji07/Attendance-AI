import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Classroom from '../models/Classroom.js';
import User from '../models/User.js'; // CORRECTED: Lowercase 'user.js'
import FormData from 'form-data';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

const FLASK_API_URL = process.env.PYTHON_API_URL;

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

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // Call Flask API for attendance taking (recognition)
        try {
            // --- THIS IS THE CORRECTED PART ---
            const flaskResponse = await axios.post(
                `${FLASK_API_URL}/classroom/${classroomId}/recognize_faces`, // Use the environment variable
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                    },
                    timeout: 60000 // 1 minute timeout
                }
            );

            const recognitionData = flaskResponse.data;
            const recognizedFaces = recognitionData.recognized_faces || [];
            const resultImageUrl = recognitionData.image_url;

            const sessionId = uuidv4().substring(0, 8);
            const attendanceResults = [];
            const presentRollNumbers = new Set();

            for (const face of recognizedFaces) {
                if (face.roll_number && face.roll_number !== 'Unknown' && !presentRollNumbers.has(face.roll_number)) {
                    attendanceResults.push({
                        rollNumber: face.roll_number,
                        confidence: face.confidence,
                        bbox: face.bbox,
                        status: 'present',
                        recognizedFaceImageUrl: `${FLASK_API_URL}${face.face_image_url}`
                    });
                    presentRollNumbers.add(face.roll_number);
                } else if (face.roll_number === 'Unknown') {
                    attendanceResults.push({
                        rollNumber: 'Unknown',
                        confidence: face.confidence,
                        bbox: face.bbox,
                        status: 'unknown',
                        recognizedFaceImageUrl: `${FLASK_API_URL}${face.face_image_url}`
                    });
                }
            }

            const absentCount = classroom.students.filter(student => !presentRollNumbers.has(student.rollNumber)).length;
            const presentCount = presentRollNumbers.size;

            const attendanceSession = {
                sessionId,
                date: new Date(),
                totalStudents: classroom.students.length,
                presentCount: presentCount,
                absentCount: absentCount,
                attendanceImage: `${FLASK_API_URL}${resultImageUrl}`,
                attendanceResults: attendanceResults,
                createdAt: new Date()
            };

            classroom.attendanceSessions.push(attendanceSession);
            await classroom.save();

            res.json({
                message: 'Attendance recorded successfully',
                session: attendanceSession,
                resultImage: attendanceSession.attendanceImage
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

// Get attendance history (no changes needed)
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

// Get attendance analytics (no changes needed)
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

        const totalPresent = sessions.reduce((sum, session) => sum + session.presentCount, 0);
        const averageAttendance = (totalSessions > 0 && classroom.students.length > 0)
            ? (totalPresent / (totalSessions * classroom.students.length)) * 100
            : 0;

        const attendanceTrend = sessions
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .slice(-10)
            .map(session => ({
                date: session.createdAt,
                percentage: (classroom.students.length > 0) ? (session.presentCount / classroom.students.length) * 100 : 0
            }));

        const studentAttendance = classroom.students.map(student => {
            const presentCount = sessions.reduce((count, session) => {
                const studentRecord = session.attendanceResults.find(
                    result => result.rollNumber === student.rollNumber && result.status === 'present'
                );
                return count + (studentRecord ? 1 : 0);
            }, 0);

            return {
                rollNumber: student.rollNumber,
                name: student.name,
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
