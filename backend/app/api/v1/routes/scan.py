from fastapi import APIRouter, UploadFile, File, Depends, Form
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.suspect import Case, CaseStatus
from app.models.missing_person import MissingPerson
import cv2
import numpy as np
import face_recognition
import os
import pickle
from datetime import datetime

router = APIRouter()

def get_or_compute_encoding(photo_path, stored_encoding, encoding_updated_at, current_photo_path):
    """
    Get face encoding from storage or compute it if not available or outdated
    """
    # Check if we have a valid stored encoding and photo hasn't changed
    if (stored_encoding and 
        encoding_updated_at and 
        current_photo_path and 
        os.path.exists(current_photo_path)):
        
        try:
            # Load stored encoding
            encoding = pickle.loads(stored_encoding)
            if encoding is not None and len(encoding) > 0:
                return encoding
        except Exception:
            # If loading fails, we'll recompute
            pass
    
    # Compute new encoding
    if not current_photo_path or not os.path.exists(current_photo_path):
        print(f"❌ Photo file not found: {current_photo_path}")
        return None
        
    try:
        print(f"🔍 Computing encoding for: {current_photo_path}")
        image = face_recognition.load_image_file(current_photo_path)
        encodings = face_recognition.face_encodings(image)
        
        if encodings:
            print(f"✅ Face encoding computed successfully for: {current_photo_path}")
            return encodings[0]  # Return first face encoding
        else:
            print(f"❌ No face found in image: {current_photo_path}")
    except Exception as e:
        print(f"❌ Error computing encoding for {current_photo_path}: {str(e)}")
        
    return None

def update_stored_encoding(db, model_instance, encoding):
    """Update stored face encoding for a model instance"""
    try:
        model_instance.face_encoding = pickle.dumps(encoding)
        model_instance.encoding_updated_at = datetime.utcnow()
        db.commit()
    except Exception:
        # Don't fail the scan if encoding storage fails
        pass

@router.post("/")
async def scan_and_match(
    file: UploadFile = File(...),
    threshold: float = Form(0.6),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Scan uploaded face against active cases and missing persons
    """
    try:
        print(f"🔍 Starting face scan with threshold: {threshold}")
        
        # 1. Read uploaded image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        uploaded_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if uploaded_img is None:
            return {"matches": [], "message": "Invalid image format"}
        
        rgb_uploaded = cv2.cvtColor(uploaded_img, cv2.COLOR_BGR2RGB)

        # 2. Get face encodings from uploaded image
        face_locations = face_recognition.face_locations(rgb_uploaded)
        print(f"👤 Found {len(face_locations)} face(s) in uploaded image")
        
        if not face_locations:
            return {"matches": [], "message": "No face detected in uploaded image"}
        
        uploaded_encodings = face_recognition.face_encodings(rgb_uploaded, face_locations)
        if not uploaded_encodings:
            return {"matches": [], "message": "Could not extract face features from uploaded image"}
        
        uploaded_encoding = uploaded_encodings[0] # take the first (and only) face
        print(f"✅ Face encoding extracted from uploaded image")

        # 3. Fetch active cases with photos
        active_cases = db.query(Case).filter(
            Case.status == CaseStatus.ACTIVE,
            Case.photo_path.isnot(None)
        ).all()
        print(f"📁 Found {len(active_cases)} active cases")

        # 4. Fetch approved missing persons with photos
        approved_missing_persons = db.query(MissingPerson).filter(
            MissingPerson.status == "approved",
            MissingPerson.photo_path.isnot(None)
        ).all()
        print(f"👥 Found {len(approved_missing_persons)} approved missing persons")

        all_matches = []

        def generate_photo_url(entity_type, entity_id, photo_path):
            """Generate correct photo URL based on entity type"""
            if entity_type == "missing":
                photo_url = f"/api/v1/missing-persons/{entity_id}/photo"
            elif entity_type == "criminal":
                photo_url = f"/api/v1/cases/{entity_id}/photo"
            elif entity_type == "terrorist":
                photo_url = f"/api/v1/terrorists/{entity_id}/photo"
            else:
                photo_url = f"/api/v1/cases/{entity_id}/photo"  # fallback
            
            # Verify photo file exists before returning URL
            if photo_url and os.path.exists(photo_path):
                return photo_url
            else:
                print(f"⚠️  Photo file not found for {entity_type} {entity_id}: {photo_path}")
                return None

        # 5. Compare against regular cases
        print(f"🔍 Comparing against {len(active_cases)} active cases...")
        for case in active_cases:
            case_name = case.suspect_name or case.title
            if 'vedant' in case_name.lower():
                print(f"🎯 Found Vedant case: ID {case.id}, Name: {case_name}")
            
            # Try multiple path strategies to find photo (same as photo endpoint)
            path_variants = []
            
            # 1. Use database path if it exists
            if case.photo_path:
                original_path = case.photo_path.replace('\\', '/')
                path_variants.append(original_path)
                
                # Add backend prefix if not present
                if not original_path.startswith('backend/'):
                    path_variants.append(f"backend/{original_path}")
                
                # Remove backend prefix if present (for when running from backend dir)
                if original_path.startswith('backend/'):
                    path_variants.append(original_path[8:])
            
            # 2. Try standard naming patterns
            path_variants.extend([
                f"uploads/cases/case_{case.id}.jpg",
                f"uploads/cases/case_{case.id}.jpeg",
                f"uploads/cases/case_{case.id}.png",
                f"backend/uploads/cases/case_{case.id}.jpg",
                f"backend/uploads/cases/case_{case.id}.jpeg",
                f"backend/uploads/cases/case_{case.id}.png"
            ])
            
            # Remove duplicates and find first existing file
            unique_paths = list(set(path_variants))
            case_photo_path = None
            file_size = 0
            
            for path in unique_paths:
                if os.path.exists(path):
                    case_photo_path = path
                    file_size = os.path.getsize(path)
                    break
            
            if not case_photo_path:
                if 'vedant' in case_name.lower():
                    print(f"❌ No photo file found for Vedant case: {case_name}")
                continue
            
            # Check if file is too small to contain a face
            if file_size < 1000:  # Less than 1KB is likely not a real photo
                if 'vedant' in case_name.lower():
                    print(f"❌ Photo file too small for Vedant case: {case_name} ({file_size} bytes)")
                continue
            
            if 'vedant' in case_name.lower():
                print(f"📸 Vedant photo found: {case_photo_path} ({file_size} bytes)")

            try:
                # Use stored encoding or compute new one
                suspect_encoding = get_or_compute_encoding(
                    case.photo_path, 
                    case.face_encoding, 
                    case.encoding_updated_at,
                    case_photo_path
                )
                
                if suspect_encoding is None:
                    if 'vedant' in case_name.lower():
                        print(f"❌ No encoding found for Vedant case: {case_name}")
                    continue

                # Calculate face distance
                face_distance = face_recognition.face_distance([suspect_encoding], uploaded_encoding)[0]
                confidence = max(0, min(100, (1.0 - face_distance) * 100))
                
                if 'vedant' in case_name.lower():
                    print(f"🎯 Vedant case {case.id}: Distance = {face_distance:.3f}, Confidence = {confidence:.1f}%")
                
                # Use threshold parameter (default 0.6) for more flexible matching
                if face_distance <= threshold:
                    print(f"✅ MATCH FOUND! {case_name}: Distance = {face_distance:.3f}, Confidence = {confidence:.1f}%")
                    
                    # Update stored encoding for future performance
                    update_stored_encoding(db, case, suspect_encoding)
                    
                    # Generate correct photo_url based on type and verify file exists
                    photo_url = generate_photo_url("criminal", case.id, case_photo_path)
                    
                    if photo_url:
                        all_matches.append({
                            "id": case.id,
                            "name": case.suspect_name or case.title,
                            "type": "criminal",
                            "photo_url": photo_url,
                            "match": round(confidence, 1)
                        })
                else:
                    if 'vedant' in case_name.lower():
                        print(f"❌ No match for Vedant: Distance {face_distance:.3f} > threshold {threshold}")
                        
            except Exception as e:
                # Skip problematic images silently
                if 'vedant' in case_name.lower():
                    print(f"❌ Error processing Vedant case {case_name}: {str(e)}")
                continue

        # 6. Compare against missing persons
        print(f"🔍 Comparing against {len(approved_missing_persons)} approved missing persons...")
        for person in approved_missing_persons:
            person_name = person.missing_person_name
            if 'vedant' in person_name.lower():
                print(f"🎯 Found Vedant missing person: ID {person.id}, Name: {person_name}")
            
            # Try multiple path strategies to find photo (same as photo endpoint)
            path_variants = []
            
            # 1. Use database path if it exists
            if person.photo_path:
                original_path = person.photo_path.replace('\\', '/')
                path_variants.append(original_path)
                
                # Add backend prefix if not present
                if not original_path.startswith('backend/'):
                    path_variants.append(f"backend/{original_path}")
                
                # Remove backend prefix if present (for when running from backend dir)
                if original_path.startswith('backend/'):
                    path_variants.append(original_path[8:])
            
            # 2. Try standard naming patterns
            path_variants.extend([
                f"uploads/missing_persons/missing_person_{person.id}.jpg",
                f"uploads/missing_persons/missing_person_{person.id}.jpeg",
                f"uploads/missing_persons/missing_person_{person.id}.png",
                f"backend/uploads/missing_persons/missing_person_{person.id}.jpg",
                f"backend/uploads/missing_persons/missing_person_{person.id}.jpeg",
                f"backend/uploads/missing_persons/missing_person_{person.id}.png"
            ])
            
            # 3. Try existing files (fallback for mismatched IDs)
            if person.id == 1:
                path_variants.extend([
                    "uploads/missing_persons/missing_person_3.jpg",
                    "backend/uploads/missing_persons/missing_person_3.jpg"
                ])
            
            # Remove duplicates and find first existing file
            unique_paths = list(set(path_variants))
            photo_path = None
            file_size = 0
            
            for path in unique_paths:
                if os.path.exists(path):
                    photo_path = path
                    file_size = os.path.getsize(path)
                    break
            
            if not photo_path:
                if 'vedant' in person_name.lower():
                    print(f"❌ No photo file found for Vedant missing person: {person_name}")
                continue
            
            # Check if file is too small to contain a face
            if file_size < 1000:  # Less than 1KB is likely not a real photo
                if 'vedant' in person_name.lower():
                    print(f"❌ Photo file too small for Vedant missing person: {person_name} ({file_size} bytes)")
                continue
            
            if 'vedant' in person_name.lower():
                print(f"📸 Vedant missing person photo found: {photo_path} ({file_size} bytes)")

            try:
                # Use stored encoding or compute new one
                person_encoding = get_or_compute_encoding(
                    person.photo_path,
                    person.face_encoding,
                    person.encoding_updated_at,
                    photo_path
                )
                
                if person_encoding is None:
                    if 'vedant' in person_name.lower():
                        print(f"❌ No encoding found for Vedant missing person: {person_name}")
                    continue

                # Calculate face distance
                face_distance = face_recognition.face_distance([person_encoding], uploaded_encoding)[0]
                confidence = max(0, min(100, (1.0 - face_distance) * 100))
                
                if 'vedant' in person_name.lower():
                    print(f"🎯 Vedant missing person {person.id}: Distance = {face_distance:.3f}, Confidence = {confidence:.1f}%")
                
                # Use threshold parameter (default 0.6) for more flexible matching
                if face_distance <= threshold:
                    print(f"✅ MATCH FOUND! {person_name}: Distance = {face_distance:.3f}, Confidence = {confidence:.1f}%")
                    
                    # Update stored encoding for future performance
                    update_stored_encoding(db, person, person_encoding)
                    
                    # Generate correct photo_url based on type and verify file exists
                    photo_url = generate_photo_url("missing", person.id, photo_path)
                    
                    if photo_url:
                        all_matches.append({
                            "id": person.id,
                            "name": person.missing_person_name,
                            "type": "missing",
                            "photo_url": photo_url,
                            "match": round(confidence, 1)
                        })
                else:
                    if 'vedant' in person_name.lower():
                        print(f"❌ NO MATCH for Vedant missing person: Distance {face_distance:.3f} > threshold {threshold}")
                        print(f"   Person: {person_name}")
                        print(f"   Photo: {photo_path}")
                        print(f"   Confidence: {confidence:.1f}%")
                        
            except Exception as e:
                # Skip problematic images silently
                if 'vedant' in person_name.lower():
                    print(f"❌ Error processing Vedant missing person {person_name}: {str(e)}")
                continue

        # Sort matches by match score (highest first) to get the best match
        all_matches.sort(key=lambda x: x["match"], reverse=True)
        
        # Return only the best match if it exists and meets minimum confidence threshold
        best_match = None
        if all_matches:
            # Only consider matches with confidence > 60% as valid
            valid_matches = [match for match in all_matches if match["match"] > 60.0]
            best_match = valid_matches[0] if valid_matches else None
        
        # Log match for debugging
        if best_match:
            print(f"✅ SCAN MATCH FOUND:")
            print(f"   ID: {best_match['id']}")
            print(f"   Name: {best_match['name']}")
            print(f"   Type: {best_match['type']}")
            print(f"   Photo URL: {best_match['photo_url']}")
            print(f"   Match: {best_match['match']}%")
        else:
            print("❌ NO MATCHES FOUND - Confidence too low or no faces matched")
        
        return {
            "matches": [best_match] if best_match else [],
            "message": "Best match found" if best_match else "No matching suspect records found",
            "faces_detected": len(face_locations),
            "total_candidates_processed": len(active_cases) + len(approved_missing_persons)
        }
    except Exception as e:
        return {"matches": [], "message": f"Error processing image: {str(e)}", "faces_detected": 0}
