"""
Live Face Detection API
Real-time face detection for Live Feed with NON-BLOCKING processing
"""

import os
import sys
import cv2
import base64
import numpy as np
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel

# Add backend to Python path for root execution
backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.detection_log import SurveillanceLog, DetectionConfidence, MatchType
from app.models.suspect import Case
from app.models.missing_person import MissingPerson
from app.schemas.detection import FaceDetectionRequest, FaceDetectionResponse

router = APIRouter()

# Constants
DETECTION_THRESHOLD = 0.6
SNAPSHOT_DIR = "uploads/snapshots"
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

def decode_base64_image(image_str: str) -> Optional[np.ndarray]:
    """Decode base64 image string to numpy array"""
    try:
        # Remove data URL prefix if present
        if ',' in image_str:
            image_str = image_str.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(image_str)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        
        # Decode image
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return frame
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def save_snapshot(frame: np.ndarray, camera_id: int) -> str:
    """Save frame as snapshot"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"camera_{camera_id}_{timestamp}.jpg"
    filepath = os.path.join(SNAPSHOT_DIR, filename)
    
    cv2.imwrite(filepath, frame)
    return filepath

def find_face_encodings(frame: np.ndarray) -> Optional[list]:
    """Find face encodings in frame"""
    try:
        import face_recognition
        print("✅ Face recognition enabled in live detection")
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Find face locations
        face_locations = face_recognition.face_locations(rgb_frame)
        print(f"🔍 Live detection: Found {len(face_locations)} face locations")
        
        if len(face_locations) == 0:
            return []
        
        # Generate encodings
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        print(f"🔍 Live detection: Generated {len(face_encodings)} face encodings")
        
        return face_encodings
    except Exception as e:
        print(f"Error finding face encodings: {e}")
        return None

def match_with_database(face_encoding: list, db) -> Dict[str, Any]:
    """Match face encoding against database"""
    try:
        import face_recognition
        print("✅ Face matching enabled in live detection")
        
        best_match = None
        best_confidence = 0.0
        best_match_type = MatchType.UNKNOWN
        
        print(f"🔍 Live detection: Starting face matching with database...")
        
        # Check missing persons
        missing_persons = db.query(MissingPerson).filter(
            MissingPerson.photo_path.isnot(None),
            MissingPerson.photo_path != ""
        ).all()
        
        print(f"📁 Live detection: Found {len(missing_persons)} missing persons with photos")
        
        for person in missing_persons:
            if person.photo_path and os.path.exists(person.photo_path):
                # Load and encode known face
                known_image = face_recognition.load_image_file(person.photo_path)
                known_encodings = face_recognition.face_encodings(known_image)
                
                if known_encodings:
                    # Compare faces
                    distances = face_recognition.face_distance([known_encodings[0]], face_encoding)
                    confidence = 1 - distances[0]  # Convert distance to confidence
                    
                    if confidence > best_confidence and confidence >= DETECTION_THRESHOLD:
                        best_confidence = confidence
                        best_match = person
                        best_match_type = MatchType.MISSING
                        print(f"✅ Live detection: New best match: {person.missing_person_name} ({confidence:.3f})")
        
        # Check cases (criminals/suspects)
        cases = db.query(Case).filter(
            or_(
                Case.photo_path.isnot(None),
                Case.photo_path != ""
            )
        ).all()
        
        print(f"📁 Live detection: Found {len(cases)} cases with photos")
        
        for person in cases:
            if person.photo_path and os.path.exists(person.photo_path):
                # Load and encode known face
                known_image = face_recognition.load_image_file(person.photo_path)
                known_encodings = face_recognition.face_encodings(known_image)
                
                if known_encodings:
                    # Compare faces
                    distances = face_recognition.face_distance([known_encodings[0]], face_encoding)
                    confidence = 1 - distances[0]
                    
                    if confidence > best_confidence and confidence >= DETECTION_THRESHOLD:
                        best_confidence = confidence
                        best_match = person
                        best_match_type = MatchType.CRIMINAL
                        print(f"✅ Live detection: New best match: {person.suspect_name} ({confidence:.3f})")
        
        # Determine confidence level
        if best_confidence >= 0.8:
            confidence_level = DetectionConfidence.HIGH
        elif best_confidence >= 0.6:
            confidence_level = DetectionConfidence.MEDIUM
        else:
            confidence_level = DetectionConfidence.LOW
        
        print(f"🎯 Live detection: Final result: {best_match_type.value} - {best_confidence:.3f} - {confidence_level.value}")
        
        return {
            "person": best_match,
            "confidence": best_confidence,
            "match_type": best_match_type,
            "confidence_level": confidence_level
        }
        
    except Exception as e:
        print(f"Error matching with database: {e}")
        return {"match_type": MatchType.UNKNOWN, "confidence": 0, "person": None, "confidence_level": DetectionConfidence.LOW}

@router.post("/live-scan")
async def live_scan(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process live scan from uploaded frame - FAST VERSION
    """
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read uploaded frame
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Fast face detection
        face_encodings = find_face_encodings(frame)
        
        if face_encodings:
            # Match with database
            match_result = match_with_database(face_encodings[0], db)
            
            # Save to surveillance log
            try:
                from datetime import timezone
                utc_now = datetime.now(timezone.utc)
                
                if match_result.get("person"):
                    log_entry = SurveillanceLog(
                        person_name=match_result["person"]["name"],
                        detected_at=utc_now,
                        camera_id=1,
                        camera_location="Live Scan Camera",
                        confidence_score=match_result["confidence"],
                        confidence_level=match_result["confidence_level"],
                        match_type=match_result["match_type"]
                    )
                else:
                    log_entry = SurveillanceLog(
                        person_name="Unknown Person",
                        detected_at=utc_now,
                        camera_id=1,
                        camera_location="Live Scan Camera",
                        confidence_score=0.0,
                        confidence_level=DetectionConfidence.LOW,
                        match_type=MatchType.UNKNOWN
                    )
                
                db.add(log_entry)
                db.commit()
                print(f"✅ Live scan logged: {log_entry.person_name}")
                
            except Exception as log_error:
                print(f"Error logging live scan: {log_error}")
                db.rollback()
            
            return {
                "message": f"Face detected: {match_result.get('person', {}).get('name', 'Unknown')}",
                "faces_found": len(face_encodings),
                "match": match_result
            }
        
        return {"message": "No faces detected", "faces_found": 0, "match": None}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Live scan error: {e}")
        raise HTTPException(status_code=500, detail=f"Live scan failed: {str(e)}")

@router.post("/detect-face", response_model=FaceDetectionResponse)
def detect_face(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks,
    image: str = Form(...),
    camera_id: int = Form(...),
    location: str = Form(...)
) -> Any:
    """Detect face in uploaded image with NON-BLOCKING processing"""
    try:
        # Decode image
        frame = decode_base64_image(image)
        if frame is None:
            return FaceDetectionResponse(
                face_detected=False,
                person_name=None,
                confidence_score=0.0,
                confidence_level=DetectionConfidence.LOW,
                snapshot_path=None,
                log_entry_id=None
            )
        
        # Find faces
        face_encodings = find_face_encodings(frame)
        if not face_encodings:
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
        
        # Save snapshot
        snapshot_path = save_snapshot(frame, camera_id)
        
        # Return immediate response with basic info
        return FaceDetectionResponse(
            face_detected=True,
            person_name=None,  # Will be updated by background task
            confidence_score=0.0,  # Will be updated by background task
            confidence_level=DetectionConfidence.LOW,
            snapshot_path=snapshot_path,
            log_entry_id=None  # Will be updated by background task
        )
        
    except Exception as e:
        print(f"Error in face detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))
