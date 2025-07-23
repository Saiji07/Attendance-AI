from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import cv2
import torch
import pickle
import numpy as np
import pandas as pd
from PIL import Image
from io import BytesIO
import base64
import json
from datetime import datetime
import tempfile
import shutil
from werkzeug.utils import secure_filename
import traceback
import uuid

# Import your existing modules (make sure to modularize the original code)
# from face_recognition_utils import (
#     detect_and_crop_faces_mtcnn,
#     augment_faces_mtcnn,
#     train_siamese_network,
#     generate_embeddings,
#     detect_and_recognize_faces,
#     EnhancedSiameseNetwork,
#     preprocess_image,
#     enhance_face,
#     MTCNN,
#     InceptionResnetV1
# )
# from torchvision import transforms

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
CLASSROOMS_FOLDER = 'classrooms'
MODELS_FOLDER = 'models'
RESULTS_FOLDER = 'results'
ATTENDANCE_FOLDER = 'attendance'

# Create necessary directories
for folder in [UPLOAD_FOLDER, CLASSROOMS_FOLDER, MODELS_FOLDER, RESULTS_FOLDER, ATTENDANCE_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# Global variables for currently loaded model
current_classroom_id = None
current_model = None
current_embeddings = None
current_label_embeddings = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

def encode_image_to_base64(image_path):
    """Convert image to base64 string"""
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

def save_base64_image(base64_string, filename):
    """Save base64 string as image file"""
    img_data = base64.b64decode(base64_string)
    with open(filename, 'wb') as f:
        f.write(img_data)
    return filename

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'device': str(device),
        'current_classroom': current_classroom_id,
        'model_loaded': current_model is not None,
        'service': 'Python Face Recognition API'
    })

@app.route('/api/classrooms/<classroom_id>/upload-group-photo', methods=['POST'])
def upload_group_photo(classroom_id):
    """Upload group photo for a specific classroom"""
    try:
        data = request.get_json()
        image_data = data.get('image_data')
        filename = data.get('filename', 'group_photo.jpg')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Create classroom directory
        classroom_dir = os.path.join(CLASSROOMS_FOLDER, classroom_id)
        os.makedirs(classroom_dir, exist_ok=True)
        os.makedirs(os.path.join(classroom_dir, 'datasets'), exist_ok=True)
        
        # Save image from base64
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        image_filename = f"group_photo_{timestamp}_{filename}"
        image_path = os.path.join(classroom_dir, 'datasets', image_filename)
        
        # Decode and save image
        img_data = base64.b64decode(image_data)
        with open(image_path, 'wb') as f:
            f.write(img_data)
        
        # TODO: Implement face detection using your face_recognition_utils
        # For now, return mock data
        faces_detected = 5  # Mock number
        faces_for_labeling = []
        
        # Mock face detection results
        for i in range(faces_detected):
            faces_for_labeling.append({
                'face_id': i,
                'image_base64': image_data[:100] + '...',  # Mock face image
                'confidence': 0.95
            })
        
        return jsonify({
            'message': 'Group photo uploaded successfully',
            'classroom_id': classroom_id,
            'faces_detected': faces_detected,
            'faces_for_labeling': faces_for_labeling
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Error uploading group photo: {str(e)}'}), 500

@app.route('/api/classrooms/<classroom_id>/assign-students', methods=['POST'])
def assign_students_to_classroom(classroom_id):
    """Assign student roll numbers to detected faces in classroom"""
    try:
        data = request.get_json()
        roll_assignments = data.get('roll_assignments')
        
        if not roll_assignments:
            return jsonify({'error': 'Roll assignments required'}), 400
        
        # TODO: Implement student assignment using your face_recognition_utils
        # For now, return success
        
        return jsonify({
            'message': 'Students assigned successfully',
            'classroom_id': classroom_id,
            'assignments': roll_assignments
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Error assigning students: {str(e)}'}), 500

@app.route('/api/classrooms/<classroom_id>/train-model', methods=['POST'])
def train_classroom_model(classroom_id):
    """Train model for a specific classroom"""
    try:
        data = request.get_json()
        epochs = data.get('epochs', 20)
        batch_size = data.get('batch_size', 32)
        
        # TODO: Implement model training using your face_recognition_utils
        # For now, return mock success
        
        return jsonify({
            'message': 'Model trained successfully',
            'classroom_id': classroom_id,
            'epochs': epochs,
            'batch_size': batch_size,
            'training_time': '5 minutes'
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Error training model: {str(e)}'}), 500

@app.route('/api/classrooms/<classroom_id>/take-attendance', methods=['POST'])
def take_attendance(classroom_id):
    """Take attendance for a specific classroom"""
    try:
        data = request.get_json()
        image_data = data.get('image_data')
        filename = data.get('filename', 'attendance.jpg')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # TODO: Implement attendance taking using your face_recognition_utils
        # For now, return mock attendance results
        
        mock_results = [
            {'roll_number': '001', 'status': 'present', 'confidence': 0.95},
            {'roll_number': '002', 'status': 'present', 'confidence': 0.87},
            {'roll_number': '003', 'status': 'absent', 'confidence': 0.0},
            {'roll_number': '004', 'status': 'present', 'confidence': 0.92},
        ]
        
        present_count = len([r for r in mock_results if r['status'] == 'present'])
        absent_count = len([r for r in mock_results if r['status'] == 'absent'])
        
        session_info = {
            'present_count': present_count,
            'absent_count': absent_count,
            'attendance_results': mock_results
        }
        
        return jsonify({
            'message': 'Attendance recorded successfully',
            'session_info': session_info,
            'result_image': image_data[:100] + '...'  # Mock result image
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Error taking attendance: {str(e)}'}), 500

@app.route('/api/classrooms/<classroom_id>', methods=['DELETE'])
def delete_classroom(classroom_id):
    """Delete a classroom and all its data"""
    try:
        classroom_dir = os.path.join(CLASSROOMS_FOLDER, classroom_id)
        if os.path.exists(classroom_dir):
            shutil.rmtree(classroom_dir)
        
        return jsonify({'message': 'Classroom data deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Error deleting classroom: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting Python Face Recognition API Server...")
    print(f"Device: {device}")
    print("Available endpoints:")
    print("  GET    /api/health - Health check")
    print("  POST   /api/classrooms/{id}/upload-group-photo - Upload group photo")
    print("  POST   /api/classrooms/{id}/assign-students - Assign roll numbers to faces")
    print("  POST   /api/classrooms/{id}/train-model - Train recognition model")
    print("  POST   /api/classrooms/{id}/take-attendance - Take attendance")
    print("  DELETE /api/classrooms/{id} - Delete classroom data")
    
    app.run(host='0.0.0.0', port=8000, debug=True)