import base64
import cv2
import numpy as np
# import face_recognition  # Temporarily disabled for testing
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.models.detection_log import SurveillanceLog, DetectionConfidence
from app.models.camera import Camera
from app.models.suspect import Case
from app.schemas.detection import SurveillanceLogCreate
import os
from datetime import datetime

class FaceRecognitionService:
    def __init__(self):
        # Load face cascade classifier for basic face detection
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
    def decode_base64_image(self, base64_str: str) -> Optional[np.ndarray]:
        """Decode base64 image string to OpenCV image"""
        try:
            print("Starting base64 image decoding...")
            
            # Remove data URL prefix if present
            if ',' in base64_str:
                base64_str = base64_str.split(',')[1]
                print("Removed data URL prefix")
            
            # Decode base64
            img_data = base64.b64decode(base64_str)
            print(f"Decoded base64 data: {len(img_data)} bytes")
            
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                print("Failed to decode image with OpenCV")
                raise ValueError("Could not decode image")
            
            print(f"Successfully decoded image: {img.shape}")
            return img
            
        except Exception as e:
            print(f"Error decoding base64 image: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def detect_face(self, image: np.ndarray) -> Optional[List[Tuple[int, int, int, int]]]:
        """Detect faces in image using face_recognition library"""
        try:
            print("⚠️ Face detection temporarily disabled for testing")
            return None
        except Exception as e:
            print(f"Error detecting face: {e}")
            return None
    
    def save_snapshot(self, image: np.ndarray, camera_id: int, timestamp: datetime) -> str:
        """Save image snapshot and return file path"""
        try:
            # Create snapshots directory if it doesn't exist
            snapshots_dir = "uploads/snapshots"
            os.makedirs(snapshots_dir, exist_ok=True)
            
            # Generate filename
            filename = f"camera_{camera_id}_{timestamp.strftime('%Y%m%d_%H%M%S')}.jpg"
            filepath = os.path.join(snapshots_dir, filename)
            
            # Save image
            cv2.imwrite(filepath, image)
            
            return filepath
        except Exception as e:
            print(f"Error saving snapshot: {e}")
            return ""
    
    def compare_with_known_suspects(self, face_image: np.ndarray, face_location: Tuple[int, int, int, int], db: Session, threshold: float = 0.6) -> Optional[Tuple[str, float]]:
        """Compare detected face with known suspects using face_recognition library"""
        try:
            print(" Face comparison temporarily disabled for testing")
            return None
        except Exception as e:
            print(f"Error comparing with suspects: {e}")
            return None
    
    def get_confidence_level(self, score: float) -> DetectionConfidence:
        """Convert confidence score to confidence level"""
        if score >= 0.8:
            return DetectionConfidence.HIGH
        elif score >= 0.6:
            return DetectionConfidence.MEDIUM
        else:
            return DetectionConfidence.LOW
    
    def process_frame_detection(self, db: Session, camera_id: int, base64_image: str) -> dict:
        """Main method to process frame for face detection and logging"""
        try:
            # Get camera info
            camera = db.query(Camera).filter(Camera.id == camera_id).first()
            if not camera:
                return {"error": "Camera not found"}
            
            # Decode image
            image = self.decode_base64_image(base64_image)
            if image is None:
                return {"error": "Invalid image data"}
            
            # Detect faces
            face_locations = self.detect_face(image)
            if face_locations is None:
                return {"face_detected": False}
            
            # Use the first face detected
            face_location = face_locations[0]
            
            # Compare with known suspects
            match_result = self.compare_with_known_suspects(image, face_location, db)
            
            # Prepare log entry data
            timestamp = datetime.now()
            snapshot_path = self.save_snapshot(image, camera_id, timestamp)
            
            person_name = None
            confidence_score = 0.0
            
            if match_result:
                person_name, confidence_score = match_result
            
            confidence_level = self.get_confidence_level(confidence_score)
            
            # Create surveillance log entry
            log_entry = SurveillanceLog(
                person_name=person_name,
                camera_location=camera.location or f"Camera {camera_id}",
                confidence_score=confidence_score,
                confidence_level=confidence_level,
                snapshot_path=snapshot_path,
                notes=f"Face detected at {timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
            )
            
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            
            return {
                "face_detected": True,
                "person_name": person_name,
                "confidence_score": confidence_score,
                "confidence_level": confidence_level,
                "snapshot_path": snapshot_path,
                "log_entry_id": log_entry.id
            }
            
        except Exception as e:
            print(f"Error in process_frame_detection: {e}")
            return {"error": str(e)}

# Global instance
face_recognition_service = FaceRecognitionService()