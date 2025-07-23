import os
import torch

class Config:
    # Base directory for the Flask app
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    # Uploads directory
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    # Ensure upload folder exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Directories for managing face data, models, and embeddings
    DATASETS_FOLDER = os.path.join(BASE_DIR, 'datasets')
    MODELS_FOLDER = os.path.join(BASE_DIR, 'models')
    EMBEDDINGS_FOLDER = os.path.join(BASE_DIR, 'embeddings')
    RECOGNIZED_FACES_FOLDER = os.path.join(BASE_DIR, 'recognized_faces')
    OUTPUT_IMAGES_FOLDER = os.path.join(BASE_DIR, 'output_images')

    # Ensure all necessary directories exist
    os.makedirs(DATASETS_FOLDER, exist_ok=True)
    os.makedirs(MODELS_FOLDER, exist_ok=True)
    os.makedirs(EMBEDDINGS_FOLDER, exist_ok=True)
    os.makedirs(RECOGNIZED_FACES_FOLDER, exist_ok=True)
    os.makedirs(OUTPUT_IMAGES_FOLDER, exist_ok=True)

    # Allowed extensions for image uploads
    ALLOWED_EXTENSIONS = ('.png', '.jpg', '.jpeg')

    # Face recognition confidence threshold (can be adjusted)
    RECOGNITION_CONFIDENCE_THRESHOLD = 0.3

    # Device for PyTorch
    DEVICE = 'cuda' if os.environ.get('USE_CUDA', 'false').lower() == 'true' and torch.cuda.is_available() else 'cpu'