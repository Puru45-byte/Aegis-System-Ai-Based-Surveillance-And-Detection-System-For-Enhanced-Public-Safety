import cv2
import face_recognition
import time
from typing import Generator
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.detection_log import SurveillanceLog
from app.models.suspect import Case, CaseStatus
from app.models.missing_person import MissingPerson
from fastapi import BackgroundTasks

# Thread-safe camera stream cache to avoid re-opening on each frame
_camera_streams: dict = {}

def get_camera_stream(cam_id: int, rtsp_url: str):
    """Get or create an OpenCV VideoCapture for a given camera."""
    if cam_id not in _camera_streams:
        cap = cv2.VideoCapture(rtsp_url)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        _camera_streams[cam_id] = cap
    return _camera_streams[cam_id]

def release_camera_stream(cam_id: int):
    if cam_id in _camera_streams:
        _camera_streams[cam_id].release()
        del _camera_streams[cam_id]

def match_detected_face(face_encoding, db: Session):
    """Match detected face against database and return person info - OPTIMIZED"""
    try:
        # Get all active cases with face encodings (optimized query)
        active_cases = db.query(Case).filter(
            Case.status == CaseStatus.ACTIVE,
            Case.face_encoding.isnot(None)
        ).all()
        
        # Get all approved missing persons with face encodings (optimized query)
        approved_missing = db.query(MissingPerson).filter(
            MissingPerson.status == "approved",
            MissingPerson.face_encoding.isnot(None)
        ).all()
        
        best_match = None
        best_confidence = 0
        
        # Pre-load all stored encodings for batch processing
        case_encodings = []
        for case in active_cases:
            if hasattr(case, 'face_encoding') and case.face_encoding:
                try:
                    import pickle
                    stored_encoding = pickle.loads(case.face_encoding)
                    if stored_encoding is not None:
                        case_encodings.append({
                            'encoding': stored_encoding,
                            'name': case.suspect_name or case.title or "Unknown",
                            'type': 'criminal',
                            'id': case.id
                        })
                except Exception:
                    continue
        
        missing_encodings = []
        for person in approved_missing:
            if hasattr(person, 'face_encoding') and person.face_encoding:
                try:
                    import pickle
                    stored_encoding = pickle.loads(person.face_encoding)
                    if stored_encoding is not None:
                        missing_encodings.append({
                            'encoding': stored_encoding,
                            'name': person.missing_person_name or "Unknown",
                            'type': 'missing',
                            'id': person.id
                        })
                except Exception:
                    continue
        
        # Batch process case encodings
        if case_encodings:
            stored_encodings = [item['encoding'] for item in case_encodings]
            face_distances = face_recognition.face_distance(stored_encodings, face_encoding)
            
            for i, distance in enumerate(face_distances):
                confidence = max(0, min(100, (1.0 - distance) * 100))
                if confidence > best_confidence and confidence > 60:
                    best_confidence = confidence
                    best_match = {
                        'name': case_encodings[i]['name'],
                        'type': case_encodings[i]['type'],
                        'id': case_encodings[i]['id']
                    }
        
        # Batch process missing person encodings
        if missing_encodings:
            stored_encodings = [item['encoding'] for item in missing_encodings]
            face_distances = face_recognition.face_distance(stored_encodings, face_encoding)
            
            for i, distance in enumerate(face_distances):
                confidence = max(0, min(100, (1.0 - distance) * 100))
                if confidence > best_confidence and confidence > 60:
                    best_confidence = confidence
                    best_match = {
                        'name': missing_encodings[i]['name'],
                        'type': missing_encodings[i]['type'],
                        'id': missing_encodings[i]['id']
                    }
        
        return best_match
        
    except Exception as e:
        print(f"Error matching face: {e}")
        return None

def save_face_detection(cam_id: int, face_encoding, db: Session, camera_location: str = None):
    """Save face detection to surveillance log"""
    try:
        # Match face against database
        matched_person = match_detected_face(face_encoding, db)
        
        if matched_person:
            # Check if this person was recently detected (avoid duplicates)
            from datetime import datetime, timedelta, timezone
            utc_now = datetime.now(timezone.utc)
            recent_time = utc_now - timedelta(minutes=5)  # 5 minute window
            
            existing_log = db.query(SurveillanceLog).filter(
                SurveillanceLog.person_name == matched_person['name'],
                SurveillanceLog.detected_at >= recent_time
            ).first()
            
            if existing_log:
                # Update existing record instead of creating new one
                existing_log.detected_at = utc_now
                existing_log.camera_id = cam_id
                existing_log.camera_location = camera_location or f"Camera {cam_id}"
                
                # Update match type if it's a criminal detection
                if matched_person['type'] == 'criminal':
                    existing_log.match_type = 'CRIMINAL'
                    existing_log.confidence_level = "HIGH" if (best_confidence if 'best_confidence' in locals() else 75.0) > 80 else "MEDIUM"
                    existing_log.confidence_score = best_confidence if 'best_confidence' in locals() else 75.0
                
                db.commit()
                print(f"Updated existing log for {matched_person['name']}")
                
                # Trigger automatic email alert for criminal detections (even for updated logs)
                if matched_person['type'] == 'criminal':
                    try:
                        from app.services.alert_service import alert_service
                        print(f"🚨 Triggering alert email for updated criminal detection: {matched_person['name']}")
                        alert_sent = alert_service.send_alert(existing_log.id, db)
                        if alert_sent:
                            print(f"✅ Alert email sent for {matched_person['name']}")
                        else:
                            print(f"❌ Alert email failed for {matched_person['name']}")
                    except Exception as alert_error:
                        print(f"❌ Error triggering alert: {alert_error}")
                
                return existing_log.id
            
            # Create new surveillance log entry
            new_log = SurveillanceLog(
                person_name=matched_person['name'],
                detected_at=utc_now,
                camera_id=cam_id,
                camera_location=camera_location or f"Camera {cam_id}",
                confidence_score=best_confidence if 'best_confidence' in locals() else 75.0,
                confidence_level="HIGH" if (best_confidence if 'best_confidence' in locals() else 75.0) > 80 else "MEDIUM",
                match_type=matched_person['type'].upper() if matched_person['type'] != 'criminal' else 'CRIMINAL'
            )
            
            db.add(new_log)
            db.commit()
            print(f"✅ Saved surveillance log for {matched_person['name']} ({matched_person['type']})")
            
            # Trigger automatic email alert for criminal detections
            if matched_person['type'] == 'criminal':
                try:
                    from app.services.alert_service import alert_service
                    print(f"🚨 Triggering alert email for criminal detection: {matched_person['name']}")
                    alert_sent = alert_service.send_alert(new_log.id, db)
                    if alert_sent:
                        print(f"✅ Alert email sent for {matched_person['name']}")
                    else:
                        print(f"❌ Alert email failed for {matched_person['name']}")
                except Exception as alert_error:
                    print(f"❌ Error triggering alert: {alert_error}")
            
            return new_log.id
        else:
            # Save unknown person detection
            from datetime import datetime, timezone
            utc_now = datetime.now(timezone.utc)
            new_log = SurveillanceLog(
                person_name="Unknown Person",
                detected_at=utc_now,
                camera_id=cam_id,
                camera_location=camera_location or f"Camera {cam_id}",
                confidence_score=0.0,
                confidence_level="LOW",
                match_type="UNKNOWN"
            )
            
            db.add(new_log)
            db.commit()
            print(f"✅ Saved surveillance log for Unknown Person")
            return new_log.id
            
    except Exception as e:
        print(f"Error saving face detection: {e}")
        db.rollback()
        return None

def generate_mjpeg_frames(cam_id: int, rtsp_url: str, camera_location: str = None, db: Session = None) -> Generator[bytes, None, None]:
    """Generator that yields MJPEG-formatted frames from an IP camera RTSP stream with optimized face detection."""
    try:
        cap = get_camera_stream(cam_id, rtsp_url)

        if not cap.isOpened():
            # Yield an error frame if can't connect
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n\r\n"
            return

        retry_count = 0
        max_retries = 3
        last_detection_time = 0
        frame_count = 0
        detection_interval = 5  # Detect every 5 frames for faster processing
        
        while True:
            try:
                ret, frame = cap.read()
                if not ret:
                    retry_count += 1
                    if retry_count >= max_retries:
                        # Too many failures, give up
                        yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n\r\n"
                        break
                    
                    # Try to reconnect
                    cap.release()
                    cap = cv2.VideoCapture(rtsp_url)
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    _camera_streams[cam_id] = cap
                    continue

                # Reset retry count on successful read
                retry_count = 0
                frame_count += 1

                # Resize for bandwidth (smaller for faster streaming)
                frame = cv2.resize(frame, (640, 480))

                # OPTIMIZED FACE DETECTION - only process every Nth frame
                if frame_count % detection_interval == 0:
                    try:
                        # Convert to RGB for face_recognition
                        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        
                        # Detect faces with optimized settings - use more sensitive parameters
                        face_locations = face_recognition.face_locations(rgb_frame, model="hog", number_of_times_to_upsample=1)
                        
                        # Only get encodings if faces found (optimization)
                        if face_locations:
                            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations, num_jitters=1)  # Faster with less jitter
                            
                            # Draw rectangles around detected faces
                            for i, (top, right, bottom, left) in enumerate(face_locations):
                                # Draw red rectangle around face
                                cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)
                                
                                # Add "FACE DETECTED" label
                                cv2.putText(frame, "FACE DETECTED", (left, top - 10),
                                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                                
                                # Save face detection to database (throttled)
                                current_time = time.time()
                                if current_time - last_detection_time > 10:  # Reduced to 10 seconds for faster logging
                                    if i < len(face_encodings):
                                        save_face_detection(cam_id, face_encodings[i], db, camera_location)
                                        last_detection_time = current_time
                        
                        # Add face count indicator
                        face_count = len(face_locations)
                        cv2.putText(frame, f"FACES: {face_count}", (10, 30),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0) if face_count > 0 else (0, 0, 255), 2)
                        
                    except Exception as face_error:
                        # If face detection fails, continue without face boxes
                        print(f"Face detection error: {face_error}")
                        pass
                else:
                    # Still show face count indicator even on non-detection frames
                    cv2.putText(frame, f"STREAMING", (10, 30),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                # Add timestamp overlay
                ts = time.strftime("%Y-%m-%d  %H:%M:%S")
                cv2.putText(frame, f"CAM-{str(cam_id).zfill(2)}  {ts}", (10, 460),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 200, 255), 1, cv2.LINE_AA)

                # Optimize JPEG encoding for faster streaming
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 60])  # Lower quality for speed
                yield (b"--frame\r\n"
                       b"Content-Type: image/jpeg\r\n\r\n"
                       + buffer.tobytes()
                       + b"\r\n")
            except Exception as e:
                # Handle any errors during frame processing
                retry_count += 1
                if retry_count >= max_retries:
                    break
                continue
                
    except GeneratorExit:
        # Clean up when client disconnects
        pass
    finally:
        # Ensure camera is released
        release_camera_stream(cam_id)
