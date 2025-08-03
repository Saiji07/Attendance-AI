
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Classroom from '../models/Classroom.js';
import User from '../models/User.js'; 
import FormData from 'form-data';

const router = express.Router();

// Configure multer for file uploads
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

const FLASK_API_URL = process.env.PYTHON_API_URL; 

// Create a new classroom
router.post('/', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { name, subject, academicYear, description } = req.body;

        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const classroomId = uuidv4().substring(0, 8);

        const classroom = new Classroom({
            classroomId,
            name,
            subject,
            academicYear,
            description,
            teacher: user._id,
            teacherName: user.fullName,
            students: [],
            attendanceSessions: [],
            groupPhotoUploaded: false,
            facesDetected: 0,
            datasetReady: false,
            modelTrained: false,
            isActive: true,
            createdAt: new Date(),
        });

        await classroom.save();

        res.status(201).json({
            message: 'Classroom created successfully',
            classroom
        });
    } catch (error) {
        console.error('Create classroom error:', error);
        res.status(500).json({ message: 'Failed to create classroom' });
    }
});

// Get all classrooms for the authenticated user
router.get('/', async (req, res) => {
    try {
        const { userId } = req.auth;

        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const classrooms = await Classroom.find({
            teacher: user._id,
            isActive: true
        }).sort({ createdAt: -1 });

        res.json({ classrooms });
    } catch (error) {
        console.error('Get classrooms error:', error);
        res.status(500).json({ message: 'Failed to get classrooms' });
    }
});

// Get specific classroom details
router.get('/:classroomId', async (req, res) => {
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

        res.json({ classroom });
    } catch (error) {
        console.error('Get classroom details error:', error);
        res.status(500).json({ message: 'Failed to get classroom details' });
    }
});

// Upload group photo
router.post('/:classroomId/upload-group-photo', upload.single('file'), async (req, res) => {
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

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        console.log("before");
        console.log(FLASK_API_URL);
        // Call Flask API for face detection
        try {
            const flaskResponse = await axios.post(
                `${FLASK_API_URL}/classroom/${classroomId}/detect_faces`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                    },
                    timeout: 30000
                }
            );

            const detectedFaces = flaskResponse.data.faces || [];

            // Update classroom with face detection results
            classroom.groupPhotoUploaded = true;
            classroom.facesDetected = detectedFaces.length;
            classroom.tempFaceData = detectedFaces.map(face => ({
                faceId: face.face_id,
                bbox: face.bbox,
                faceImageUrl: `${FLASK_API_URL}${face.face_image_url}`
            }));
            classroom.datasetReady = false;
            classroom.modelTrained = false;

            await classroom.save();

            res.json({
                message: 'Group photo uploaded and faces detected successfully',
                classroom,
                facesForLabeling: classroom.tempFaceData
            });
        } catch (flaskError) {
            console.error('Flask API error during face detection:', flaskError.response ? flaskError.response.data : flaskError.message);
            res.status(flaskError.response?.status || 500).json({
                message: 'Failed to process image with face detection service',
                error: flaskError.response?.data || flaskError.message
            });
        }
    } catch (error) {
        console.error('Upload group photo error:', error);
        res.status(500).json({ message: 'Failed to upload group photo' });
    }
});

// Assign students to faces
router.post('/:classroomId/assign-students', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { classroomId } = req.params;
        const { assignments } = req.body;

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

        // Call Flask API to assign students
        try {
            const flaskResponse = await axios.post(
                `${FLASK_API_URL}/classroom/${classroomId}/assign_roll_numbers`,
                { assignments },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            // Update classroom with students
            classroom.students = assignments.map(assignment => ({
                rollNumber: assignment.roll_number,
                name: assignment.studentName || `Student ${assignment.roll_number}`,
                faceId: assignment.face_id,
                isActive: true
            }));

            classroom.datasetReady = true;
            classroom.tempFaceData = [];
            await classroom.save();

            res.json({
                message: 'Students assigned successfully',
                classroom,
                flaskResponse: flaskResponse.data
            });
        } catch (flaskError) {
            console.error('Flask API error during student assignment:', flaskError.response ? flaskError.response.data : flaskError.message);
            res.status(flaskError.response?.status || 500).json({
                message: 'Failed to assign students with face recognition service',
                error: flaskError.response?.data || flaskError.message
            });
        }
    } catch (error) {
        console.error('Assign students error:', error);
        res.status(500).json({ message: 'Failed to assign students' });
    }
});

// Train model
router.post('/:classroomId/train-model', async (req, res) => {
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
        
        if (!classroom.datasetReady) {
            return res.status(400).json({ message: 'Dataset not ready. Please upload group photo and assign students first.' });
        }
        
        if (classroom.modelTrained) {
            return res.status(400).json({ message: 'Model already trained for this classroom. Delete existing model to retrain.' });
        }

        // Call Flask API to train model
        try {
            const flaskResponse = await axios.post(
                `${FLASK_API_URL}/classroom/${classroomId}/train_model`,
                {},
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 300000 // 5 minutes timeout for training
                }
            );

            // Update classroom with training status
            classroom.modelTrained = true;
            classroom.modelTrainedAt = new Date();
            await classroom.save();

            res.json({
                message: 'Model trained successfully',
                classroom,
                flaskResponse: flaskResponse.data
            });
        } catch (flaskError) {
            console.error('Flask API error during model training:', flaskError.response ? flaskError.response.data : flaskError.message);
            res.status(flaskError.response?.status || 500).json({
                message: 'Failed to train model with face recognition service',
                error: flaskError.response?.data || flaskError.message
            });
        }
    } catch (error) {
        console.error('Train model error:', error);
        res.status(500).json({ message: 'Failed to train model' });
    }
});

// Delete classroom
router.delete('/:classroomId', async (req, res) => {
    try {
        const { userId } = req.auth;
        const { classroomId } = req.params;

        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const classroom = await Classroom.findOneAndUpdate(
            {
                classroomId,
                teacher: user._id,
                isActive: true
            },
            { isActive: false },
            { new: true }
        );

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        res.json({ message: 'Classroom deleted successfully' });
    } catch (error) {
        console.error('Delete classroom error:', error);
        res.status(500).json({ message: 'Failed to delete classroom' });
    }
});

export default router;
