import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  faceId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const attendanceSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
    // Removed unique: true from here
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  totalStudents: {
    type: Number,
    required: true
  },
  presentCount: {
    type: Number,
    required: true
  },
  absentCount: {
    type: Number,
    required: true
  },
  attendanceImage: {
    type: String,
    required: true
  },
  attendanceResults: [{
    rollNumber: String,
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true
    },
    confidence: {
      type: Number,
      default: 0
    },
    faceImage: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const classroomSchema = new mongoose.Schema({
  classroomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    trim: true,
    default: ''
  },
  academicYear: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  teacherName: {
    type: String,
    required: true,
    trim: true
  },
  students: [studentSchema],
  groupPhotoUploaded: {
    type: Boolean,
    default: false
  },
  groupPhotoPath: {
    type: String,
    default: ''
  },
  facesDetected: {
    type: Number,
    default: 0
  },
  tempFaceData: [{
    faceId: String,
    bbox: [Number],
    faceImageUrl: String
  }],
  modelTrained: {
    type: Boolean,
    default: false
  },
  modelTrainedAt: {
    type: Date
  },
  datasetReady: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attendanceSessions: [attendanceSessionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better performance
classroomSchema.index({ teacher: 1, createdAt: -1 });
classroomSchema.index({ classroomId: 1 });
classroomSchema.index({ name: 1 });
classroomSchema.index({ createdAt: -1 });
classroomSchema.index({ 'students.rollNumber': 1 });

// Create a compound index to ensure sessionId uniqueness within each classroom
classroomSchema.index({ 'attendanceSessions.sessionId': 1, classroomId: 1 }, { unique: true, sparse: true });

// Update the updatedAt field before saving
classroomSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for students count
classroomSchema.virtual('studentsCount').get(function() {
  return this.students.filter(student => student.isActive).length;
});

// Virtual for attendance sessions count
classroomSchema.virtual('attendanceSessionsCount').get(function() {
  return this.attendanceSessions.length;
});

// Ensure virtual fields are serialized
classroomSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model('Classroom', classroomSchema);
