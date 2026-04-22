"""
Background Tasks for Non-blocking Face Detection
"""

import asyncio
import os
import sys
import cv2
import base64
import numpy as np
from datetime import datetime
from typing import Optional, Dict, Any

# Add backend to Python path for root execution
backend_path = os.path.join(os.path.dirname(__file__), '..', '..')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.api.deps import get_db
from app.models.user import User
from app.models.detection_log import SurveillanceLog, MatchType, DetectionConfidence
from app.models.suspect import Case
from app.models.missing_person import MissingPerson
from app.schemas.detection import FaceDetectionResponse
from sqlalchemy import or_

# Configuration
DETECTION_THRESHOLD = 0.5
SNAPSHOT_DIR = "uploads/logs"

def decode_base64_image(image_data: str) -> Optional[np.ndarray]:
    """Decode base64 image to OpenCV format"""
    try:
        # Remove data URL prefix
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        decoded = base64.b64decode(image_data)
        nparr = np.frombuffer(decoded, np.uint8)
        
        # Convert to OpenCV format
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            print("❌ Failed to decode image")
            return None
            
        print(f"✅ Image decoded successfully: {frame.shape}")
        return frame
        
    except Exception as e:
        print(f"❌ Error decoding image: {e}")
        return None

def resize_frame(frame: np.ndarray, max_size: int = 640) -> np.ndarray:
    """Resize frame for performance"""
    try:
        h, w = frame.shape[:2]
        
        if h > max_size or w > max_size:
            if h > w:
                new_h = max_size
                new_w = int(w * max_size / h)
            else:
                new_w = max_size
                new_h = int(h * max_size / w)
            
            frame = cv2.resize(frame, (new_w, new_h))
            print(f"🔄 Frame resized to {frame.shape}")
            
        return frame
        
    except Exception as e:
        print(f"❌ Error resizing frame: {e}")
        return frame

def find_face_encodings(frame: np.ndarray) -> Optional[list]:
    """Find face encodings in frame"""
    try:
        import face_recognition
        print("✅ Face recognition enabled")
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Find face locations
        face_locations = face_recognition.face_locations(rgb_frame)
        print(f"🔍 Found {len(face_locations)} face locations")
        
        if len(face_locations) == 0:
            return []
        
        # Generate encodings
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        print(f"🔍 Generated {len(face_encodings)} face encodings")
        
        return face_encodings
        
    except Exception as e:
        print(f"❌ Error finding face encodings: {e}")
        return None

def match_with_database(face_encoding: list, db) -> Dict[str, Any]:
    """Match face encoding against database"""
    try:
        import face_recognition
        print("✅ Face matching enabled")
        
        best_match = None
        best_confidence = 0.0
        best_match_type = MatchType.UNKNOWN
        
        print(f"🔍 Starting face matching with database...")
        
        # Check missing persons
        missing_persons = db.query(MissingPerson).filter(
            MissingPerson.photo_path.isnot(None),
            MissingPerson.photo_path != ""
        ).all()
        
        print(f"📁 Found {len(missing_persons)} missing persons with photos")
        
        for person in missing_persons:
            if person.photo_path and os.path.exists(person.photo_path):
                print(f"🔍 DEBUG: Loading photo: {person.photo_path}")
                # Load and encode known face
                known_image = face_recognition.load_image_file(person.photo_path)
                known_encodings = face_recognition.face_encodings(known_image)
                
                print(f"🔍 DEBUG: Known encodings found: {len(known_encodings)}")
                
                if known_encodings:
                    # Compare faces
                    distances = face_recognition.face_distance([known_encodings[0]], face_encoding)
                    confidence = 1 - distances[0]  # Convert distance to confidence
                    
                    print(f"👤 Missing Person {person.id}: {person.missing_person_name} - Confidence: {confidence:.3f}")
                    print(f"🔍 DEBUG: Distance: {distances[0]:.3f}, Threshold: {DETECTION_THRESHOLD}")
                    
                    if confidence > best_confidence and confidence >= DETECTION_THRESHOLD:
                        best_confidence = confidence
                        best_match = person
                        best_match_type = MatchType.MISSING
                        print(f"✅ New best match: {person.missing_person_name} ({confidence:.3f})")
        
        # Check cases (criminals/suspects)
        cases = db.query(Case).filter(
            or_(
                Case.photo_path.isnot(None),
                Case.photo_path != ""
            )
        ).all()
        
        print(f"📁 Found {len(cases)} cases with photos")
        
        for person in cases:
            if person.photo_path and os.path.exists(person.photo_path):
                print(f"🔍 DEBUG: Loading case photo: {person.photo_path}")
                # Load and encode known face
                known_image = face_recognition.load_image_file(person.photo_path)
                known_encodings = face_recognition.face_encodings(known_image)
                
                print(f"🔍 DEBUG: Case encodings found: {len(known_encodings)}")
                
                if known_encodings:
                    # Compare faces
                    distances = face_recognition.face_distance([known_encodings[0]], face_encoding)
                    confidence = 1 - distances[0]
                    
                    print(f"👤 Case {person.id}: {person.suspect_name} - Confidence: {confidence:.3f}")
                    print(f"🔍 DEBUG: Distance: {distances[0]:.3f}, Threshold: {DETECTION_THRESHOLD}")
                    
                    if confidence > best_confidence and confidence >= DETECTION_THRESHOLD:
                        best_confidence = confidence
                        best_match = person
                        best_match_type = MatchType.CRIMINAL
                        print(f"✅ New best match: {person.suspect_name} ({confidence:.3f})")
        
        # Determine confidence level
        if best_confidence >= 0.8:
            confidence_level = DetectionConfidence.HIGH
        elif best_confidence >= 0.6:
            confidence_level = DetectionConfidence.MEDIUM
        else:
            confidence_level = DetectionConfidence.LOW
        
        print(f"🎯 Final result: {best_match_type.value} - {best_confidence:.3f} - {confidence_level.value}")
        
        return {
            "person": best_match,
            "confidence": best_confidence,
            "match_type": best_match_type,
            "confidence_level": confidence_level
        }
        
    except Exception as e:
        print(f"❌ Error matching with database: {e}")
        import traceback
        traceback.print_exc()
        return {"match_type": MatchType.UNKNOWN, "confidence": 0, "person": None, "confidence_level": DetectionConfidence.LOW}

def remove_duplicate_entries(person_name: str, person_id: int, db) -> None:
    """Remove previous entries of the same person"""
    try:
        if person_name and person_id:
            # Delete previous entries for the same person
            deleted_count = db.query(SurveillanceLog).filter(
                SurveillanceLog.person_name == person_name,
                SurveillanceLog.person_id == person_id
            ).delete()
            
            if deleted_count > 0:
                print(f"🗑️  Removed {deleted_count} previous entries for {person_name}")
                db.commit()
        
    except Exception as e:
        print(f"❌ Error removing duplicates: {e}")

def save_snapshot(frame: np.ndarray, camera_id: int) -> str:
    """Save frame snapshot and return path"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"camera_{camera_id}_{timestamp}.jpg"
        filepath = os.path.join(SNAPSHOT_DIR, filename)
        
        # Ensure directory exists
        os.makedirs(SNAPSHOT_DIR, exist_ok=True)
        
        cv2.imwrite(filepath, frame)
        print(f"✅ Snapshot saved: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"❌ Error saving snapshot: {e}")
        return None

async def process_frame_async(data: Dict[str, Any]) -> FaceDetectionResponse:
    """Process frame asynchronously - NON-BLOCKING"""
    try:
        print("🎯 Processing frame in background...")
        
        # Decode image
        frame = decode_base64_image(data["image"])
        if frame is None:
            return FaceDetectionResponse(
                face_detected=False,
                person_name=None,
                confidence_score=0.0,
                confidence_level=DetectionConfidence.LOW,
                snapshot_path=None,
                log_entry_id=None
            )
        
        # Resize for performance
        frame = resize_frame(frame)
        
        # Find faces
        face_encodings = find_face_encodings(frame)
        print(f"🔍 DEBUG: Face locations found: {len(face_encodings)}")
        
        if not face_encodings:
            print("🔍 No faces found in frame")
            return FaceDetectionResponse(
                face_detected=False,
                person_name=None,
                confidence_score=0.0,
                confidence_level=DetectionConfidence.LOW,
                snapshot_path=None,
                log_entry_id=None
            )
        
        # Process first face found
        face_encoding = face_encodings[0]
        print(f"🔍 DEBUG: Face encoding shape: {len(face_encoding)}")
        print(f"🔍 DEBUG: Face encoding sample: {face_encoding[:5] if len(face_encoding) > 5 else face_encoding}")
        
        # Get database session
        from app.api.deps import get_db
        db = next(get_db())
        
        # Check if live detection is active
        try:
            from app.websockets.manager import manager
            if not manager.is_live_detection_active():
                print("⏸️ Live detection is not active - skipping processing")
                return FaceDetectionResponse(
                    face_detected=True,
                    person_name=None,
                    confidence_score=0.0,
                    confidence_level=DetectionConfidence.LOW,
                    snapshot_path=None,
                    log_entry_id=None
                )
        except Exception as e:
            print(f"⚠️ Could not check live detection status: {e}")
        
        try:
            print("🔍 DEBUG: Starting face matching...")
            # Match with database
            match_result = match_with_database(face_encoding, db)
            print(f"🔍 DEBUG: Match result: {match_result}")
            
            # Save snapshot
            snapshot_path = save_snapshot(frame, data["camera_id"])
            
            # Determine person name
            person_name = None
            person_id = None
            print(f" DEBUG: Match person exists: {match_result['person'] is not None}")
            print(f" DEBUG: Match type: {match_result['match_type']}")
            print(f" DEBUG: Match confidence: {match_result['confidence']}")
            
            if match_result["person"]:
                if match_result["match_type"] == MatchType.MISSING:
                    person_name = match_result["person"].missing_person_name
                    person_id = match_result["person"].id
                    print(f" DEBUG: Missing person matched: {person_name} (ID: {person_id})")
                elif match_result["match_type"] == MatchType.CRIMINAL:
                    person_name = match_result["person"].suspect_name
                    person_id = match_result["person"].id
                    print(f" DEBUG: Criminal matched: {person_name} (ID: {person_id})")
            else:
                print(" DEBUG: No person matched - will show as Unknown")
            
            # Remove duplicate entries if person identified
            if person_name and person_id:
                remove_duplicate_entries(person_name, person_id, db)
            
            # Create log entry
            log_entry = SurveillanceLog(
                person_name=person_name,
                camera_id=data["camera_id"],
                camera_location=data["location"],
                confidence_score=float(match_result["confidence"]),  # Convert numpy to Python float
                confidence_level=match_result["confidence_level"],
                snapshot_path=snapshot_path,
                image_path=snapshot_path,
                match_type=match_result["match_type"],
                person_id=person_id,
                notes=f"Face detected - {match_result['match_type'].value} match"
            )
            
            db.add(log_entry)
            db.commit()
            print(f" Log entry created: {log_entry.id}")
            print(f" DEBUG: Final person_name: {person_name}")
            print(f" DEBUG: Final confidence_score: {match_result['confidence']}")
            
            return FaceDetectionResponse(
                face_detected=True,
                person_name=person_name,
                confidence_score=float(match_result["confidence"]),  # Convert numpy to Python float
                confidence_level=match_result["confidence_level"],
                snapshot_path=snapshot_path,
                log_entry_id=log_entry.id
            )
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error in background processing: {e}")
        return FaceDetectionResponse(
            face_detected=False,
            person_name=None,
            confidence_score=0.0,
            confidence_level=DetectionConfidence.LOW,
            snapshot_path=None,
            log_entry_id=None
        )
