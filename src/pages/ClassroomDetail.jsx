import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Users, 
  Camera, 
  Brain, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { classroomAPI, attendanceAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';

export default function ClassroomDetail() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [trainingModel, setTrainingModel] = useState(false);
  const [takingAttendance, setTakingAttendance] = useState(false);
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLabelingModal, setShowLabelingModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showAttendanceResults, setShowAttendanceResults] = useState(false);
  
  // Data states
  const [facesForLabeling, setFacesForLabeling] = useState([]);
  const [studentAssignments, setStudentAssignments] = useState({});
  const [attendanceResults, setAttendanceResults] = useState(null);

  const fetchClassroom = async () => {
    try {
      const { data } = await classroomAPI.getById(classroomId);
      setClassroom(data.classroom);
    } catch (error) {
      console.error('Failed to fetch classroom:', error);
      toast.error('Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classroomId) {
      fetchClassroom();
    }
  }, [classroomId]);

  // Group photo upload
  const onDropGroupPhoto = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setUploadingPhoto(true);
    
    try {
      const { data } = await classroomAPI.uploadGroupPhoto(classroomId, file);
      setFacesForLabeling(data.facesForLabeling || []);
      setClassroom(data.classroom);
      setShowUploadModal(false);
      setShowLabelingModal(true);
      toast.success('Group photo uploaded successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload group photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const { getRootProps: getGroupPhotoProps, getInputProps: getGroupPhotoInputProps, isDragActive: isGroupPhotoDragActive } = useDropzone({
    onDrop: onDropGroupPhoto,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
  });

  // Student assignment
  const handleStudentAssignment = (faceId, rollNumber, studentName) => {
    setStudentAssignments(prev => ({
      ...prev,
      [faceId]: { rollNumber, studentName }
    }));
  };

  const submitStudentAssignments = async () => {
    const assignments = Object.entries(studentAssignments).map(([faceId, data]) => ({
      face_id: faceId,
      roll_number: data.rollNumber,
      studentName: data.studentName
    }));

    if (assignments.length === 0) {
      toast.error('Please assign at least one student');
      return;
    }

    try {
      const { data } = await classroomAPI.assignStudents(classroomId, assignments);
      setClassroom(data.classroom);
      setShowLabelingModal(false);
      toast.success('Students assigned successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign students');
    }
  };

  // Model training
  const handleTrainModel = async () => {
    setTrainingModel(true);
    try {
      const { data } = await classroomAPI.trainModel(classroomId, {});
      setClassroom(data.classroom);
      toast.success('Model trained successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to train model');
    } finally {
      setTrainingModel(false);
    }
  };

  // Attendance taking
  const onDropAttendance = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setTakingAttendance(true);
    
    try {
      const { data } = await attendanceAPI.take(classroomId, file);
      setAttendanceResults(data);
      setShowAttendanceModal(false);
      setShowAttendanceResults(true);
      toast.success('Attendance recorded successfully!');
      fetchClassroom(); // Refresh classroom data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to take attendance');
    } finally {
      setTakingAttendance(false);
    }
  };

  const { getRootProps: getAttendanceProps, getInputProps: getAttendanceInputProps, isDragActive: isAttendanceDragActive } = useDropzone({
    onDrop: onDropAttendance,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
  });

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Classroom not found</h2>
        <Button onClick={() => navigate('/classrooms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classrooms
        </Button>
      </div>
    );
  }

  const getStepStatus = (step) => {
    switch (step) {
      case 'upload':
        return classroom.groupPhotoUploaded ? 'completed' : 'pending';
      case 'assign':
        return classroom.datasetReady ? 'completed' : classroom.groupPhotoUploaded ? 'pending' : 'disabled';
      case 'train':
        return classroom.modelTrained ? 'completed' : classroom.datasetReady ? 'pending' : 'disabled';
      case 'attendance':
        return classroom.modelTrained ? 'pending' : 'disabled';
      default:
        return 'disabled';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/classrooms')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classroom.name}</h1>
            <p className="text-gray-600">{classroom.subject} • {classroom.studentsCount} Students</p>
          </div>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Step 1: Upload Group Photo */}
        <Card className={`${getStepStatus('upload') === 'completed' ? 'border-green-200 bg-green-50' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(getStepStatus('upload'))}
                <h3 className="font-semibold">Upload Photo</h3>
              </div>
              <Upload className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a group photo of your class to detect faces
            </p>
            <Button
              size="sm"
              onClick={() => setShowUploadModal(true)}
              disabled={uploadingPhoto}
              className="w-full"
            >
              {classroom.groupPhotoUploaded ? 'Re-upload Photo' : 'Upload Photo'}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Assign Students */}
        <Card className={`${getStepStatus('assign') === 'completed' ? 'border-green-200 bg-green-50' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(getStepStatus('assign'))}
                <h3 className="font-semibold">Assign Students</h3>
              </div>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Label detected faces with student roll numbers
            </p>
            <Button
              size="sm"
              onClick={() => {
                if (classroom.tempFaceData && classroom.tempFaceData.length > 0) {
                  setFacesForLabeling(classroom.tempFaceData);
                  setShowLabelingModal(true);
                }
              }}
              disabled={getStepStatus('assign') === 'disabled' || !classroom.tempFaceData?.length}
              className="w-full"
            >
              {classroom.datasetReady ? 'Re-assign Students' : 'Assign Students'}
            </Button>
          </CardContent>
        </Card>

        {/* Step 3: Train Model */}
        <Card className={`${getStepStatus('train') === 'completed' ? 'border-green-200 bg-green-50' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(getStepStatus('train'))}
                <h3 className="font-semibold">Train Model</h3>
              </div>
              <Brain className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Train AI model to recognize your students
            </p>
            <Button
              size="sm"
              onClick={handleTrainModel}
              disabled={getStepStatus('train') === 'disabled' || trainingModel}
              loading={trainingModel}
              className="w-full"
            >
              {classroom.modelTrained ? 'Model Trained' : 'Train Model'}
            </Button>
          </CardContent>
        </Card>

        {/* Step 4: Take Attendance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(getStepStatus('attendance'))}
                <h3 className="font-semibold">Take Attendance</h3>
              </div>
              <Camera className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload class photo to automatically mark attendance
            </p>
            <Button
              size="sm"
              onClick={() => setShowAttendanceModal(true)}
              disabled={!classroom.modelTrained}
              className="w-full"
            >
              Take Attendance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Classroom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{classroom.studentsCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{classroom.attendanceSessionsCount}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Model Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {classroom.modelTrained ? 'Trained' : 'Not Trained'}
                </p>
              </div>
              <Brain className={`h-8 w-8 ${classroom.modelTrained ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Group Photo Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Group Photo"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Upload a clear group photo of your class. The system will automatically detect faces for labeling.
          </p>
          
          <div
            {...getGroupPhotoProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isGroupPhotoDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getGroupPhotoInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isGroupPhotoDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
            </p>
            <p className="text-gray-600">or click to select a file</p>
            <p className="text-sm text-gray-500 mt-2">Supports: JPG, PNG (max 50MB)</p>
          </div>

          {uploadingPhoto && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Processing image and detecting faces...</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Face Labeling Modal */}
      <Modal
        isOpen={showLabelingModal}
        onClose={() => setShowLabelingModal(false)}
        title="Assign Students to Faces"
        size="xl"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            Assign roll numbers and names to the detected faces. This will help the system recognize students during attendance.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {facesForLabeling.map((face, index) => (
              <div key={face.faceId} className="border rounded-lg p-4 space-y-3">
                <img
                  src={face.faceImageUrl}
                  alt={`Face ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Roll Number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    onChange={(e) => handleStudentAssignment(
                      face.faceId,
                      e.target.value,
                      studentAssignments[face.faceId]?.studentName || ''
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Student Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    onChange={(e) => handleStudentAssignment(
                      face.faceId,
                      studentAssignments[face.faceId]?.rollNumber || '',
                      e.target.value
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowLabelingModal(false)}>
              Cancel
            </Button>
            <Button onClick={submitStudentAssignments}>
              Assign Students
            </Button>
          </div>
        </div>
      </Modal>

      {/* Take Attendance Modal */}
      <Modal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        title="Take Attendance"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Upload a photo of your class to automatically mark attendance using face recognition.
          </p>
          
          <div
            {...getAttendanceProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isAttendanceDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getAttendanceInputProps()} />
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isAttendanceDragActive ? 'Drop the image here' : 'Drag & drop a class photo here'}
            </p>
            <p className="text-gray-600">or click to select a file</p>
            <p className="text-sm text-gray-500 mt-2">Supports: JPG, PNG (max 50MB)</p>
          </div>

          {takingAttendance && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Processing attendance...</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Attendance Results Modal */}
      <Modal
        isOpen={showAttendanceResults}
        onClose={() => setShowAttendanceResults(false)}
        title="Attendance Results"
        size="xl"
      >
        {attendanceResults && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{attendanceResults.session.presentCount}</p>
                <p className="text-sm text-green-600">Present</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{attendanceResults.session.absentCount}</p>
                <p className="text-sm text-red-600">Absent</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{attendanceResults.session.totalStudents}</p>
                <p className="text-sm text-blue-600">Total</p>
              </div>
            </div>

            {attendanceResults.resultImage && (
              <div>
                <h4 className="font-medium mb-2">Processed Image</h4>
                <img
                  src={attendanceResults.resultImage}
                  alt="Attendance Result"
                  className="w-full rounded-lg border"
                />
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Attendance Details</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attendanceResults.session.attendanceResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">{result.rollNumber}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.status === 'present' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status}
                      </span>
                      {result.confidence && (
                        <span className="text-xs text-gray-500">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}