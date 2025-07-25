# Face Recognition Attendance System (MERN Stack)

A comprehensive attendance management system using face recognition technology, built with the MERN stack and integrated with Clerk authentication.

## Features

- **User Authentication**: Secure authentication with Clerk
- **Classroom Management**: Create and manage multiple classrooms
- **Face Recognition**: Upload group photos and train AI models for student identification
- **Attendance Tracking**: Take attendance using face recognition technology
- **Analytics**: View attendance reports and analytics
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Clerk for authentication
- Axios for API calls
- React Hot Toast for notifications

### Backend
- Node.js with Express (Port 5000)
- MongoDB with Mongoose
- Clerk SDK for authentication
- Multer for file uploads
- Python Flask API for face recognition (Port 8000)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Python 3.8+ (for face recognition service)
- Clerk account

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd face-recognition-attendance-mern
```

### 2. Install dependencies

#### Frontend & Backend
```bash
npm install
cd server && npm install && cd ..
```

#### Python Dependencies
```bash
pip install flask flask-cors opencv-python torch torchvision numpy pandas pillow
```

### 3. Environment Setup

Create `.env` file in root directory:
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_BASE_URL=http://localhost:5000/api
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
PYTHON_API_URL=http://localhost:8000
PORT=5000
```

Create `server/.env` file:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
PYTHON_API_URL=http://localhost:8000
NODE_ENV=development
```

### 4. Start the services

#### Option 1: Start all services together
```bash
npm run dev
```

#### Option 2: Start services individually

**Start MongoDB**
```bash
mongod
```

**Start the Python Face Recognition API (Terminal 1)**
```bash
python python_api.py
```

**Start the Node.js Backend (Terminal 2)**
```bash
cd server && npm run dev
```

**Start the React Frontend (Terminal 3)**
```bash
npm run client
```

## API Architecture

### Node.js API (Port 5000)
- Handles authentication, classroom CRUD operations
- Manages database operations with MongoDB
- Proxies face recognition requests to Python API

### Python API (Port 8000)
- Handles face detection and recognition
- Manages ML model training and inference
- Processes image uploads and attendance taking

## Usage

1. **Sign Up/Sign In**: Create an account or sign in using Clerk
2. **Create Classroom**: Create a new classroom with details
3. **Upload Group Photo**: Upload a group photo of students
4. **Assign Students**: Assign roll numbers to detected faces
5. **Train Model**: Train the AI model for face recognition
6. **Take Attendance**: Upload attendance photos to automatically mark attendance

## API Endpoints

### Node.js API (http://localhost:5000/api)
- `POST /auth/sync` - Sync user with database
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `POST /classrooms` - Create classroom
- `GET /classrooms` - Get all classrooms
- `GET /classrooms/:id` - Get classroom details
- `DELETE /classrooms/:id` - Delete classroom
- `POST /attendance/:classroomId/take` - Take attendance
- `GET /attendance/:classroomId/history` - Get attendance history
- `GET /attendance/:classroomId/analytics` - Get attendance analytics

### Python API (http://localhost:8000/api)
- `GET /health` - Health check
- `POST /classrooms/:id/upload-group-photo` - Process group photo
- `POST /classrooms/:id/assign-students` - Assign students to faces
- `POST /classrooms/:id/train-model` - Train recognition model
- `POST /classrooms/:id/take-attendance` - Process attendance image
- `DELETE /classrooms/:id` - Clean up classroom data

## Development Notes

- The Python API runs on port 8000 to avoid conflicts with the Node.js API
- Face recognition utilities need to be implemented in `face_recognition_utils.py`
- Current Python API includes mock responses for testing
- MongoDB connection is configured for both local and cloud deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.#   a t t e n d a n c e 2  
 