import os
import shutil
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_admin
from app.models.suspect import Case
from app.models.missing_person import MissingPerson
from app.schemas.suspect import CaseCreate, CaseUpdate, CaseRead

UPLOAD_DIR = "uploads/cases"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()

@router.get("/")
def get_cases(db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    """Get all cases including approved missing person reports"""
    # Get regular cases
    regular_cases = db.query(Case).order_by(Case.created_at.desc()).all()
    
    # Convert regular cases to dictionaries
    regular_case_dicts = []
    for case in regular_cases:
        case_dict = {
            "id": case.id,
            "title": case.title,
            "description": case.description,
            "suspect_name": case.suspect_name,
            "location": case.location,
            "threat_level": case.threat_level,
            "status": case.status,
            "photo_path": case.photo_path,
            "created_at": case.created_at,
            "updated_at": case.updated_at,
            "is_missing_person": False  # Flag to identify regular cases
        }
        regular_case_dicts.append(case_dict)
    
    # Get approved missing person reports
    approved_missing_persons = db.query(MissingPerson).filter(
        MissingPerson.status == "approved"
    ).order_by(MissingPerson.created_at.desc()).all()
    
    # Convert missing person reports to case-like format
    missing_person_cases = []
    for mp in approved_missing_persons:
        case_data = {
            "id": mp.id,
            "title": f"Missing Person: {mp.missing_person_name}",
            "description": f"Missing person case. Last seen: {mp.last_seen_location} on {mp.last_seen_date.strftime('%Y-%m-%d') if mp.last_seen_date else 'Unknown'}",
            "suspect_name": mp.missing_person_name,
            "location": mp.last_seen_location,
            "threat_level": "high",  # Missing person cases are high priority
            "status": "active",
            "photo_path": mp.photo_path,
            "created_at": mp.created_at,
            "updated_at": mp.updated_at,
            "is_missing_person": True  # Flag to identify missing person cases
        }
        missing_person_cases.append(case_data)
    
    # Combine both lists and sort by created_at
    all_cases = regular_case_dicts + missing_person_cases
    all_cases.sort(key=lambda x: x.get("created_at"), reverse=True)
    
    return all_cases

@router.post("/", response_model=CaseRead)
def create_case(case_in: CaseCreate, db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    case = Case(**case_in.model_dump())
    db.add(case)
    db.commit()
    db.refresh(case)
    return case

@router.put("/{case_id}", response_model=CaseRead)
def update_case(case_id: int, case_in: CaseUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    for key, value in case_in.model_dump(exclude_unset=True).items():
        setattr(case, key, value)
    db.commit()
    db.refresh(case)
    return case

@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    # First try to find as a regular case
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if case:
        # Delete regular case
        db.delete(case)
        db.commit()
        db.close()
        return {"message": "Case deleted successfully"}
    
    # If not found as regular case, try to find as missing person
    missing_person = db.query(MissingPerson).filter(MissingPerson.id == case_id).first()
    
    if missing_person:
        # Delete photo file if it exists
        if missing_person.photo_path:
            photo_path = missing_person.photo_path
            if not photo_path.startswith('backend/'):
                photo_path = f"backend/{photo_path}"
            photo_path = photo_path.replace('\\', '/')
            
            if os.path.exists(photo_path):
                os.remove(photo_path)
                print(f"Deleted photo: {photo_path}")
        
        # Delete missing person record
        db.delete(missing_person)
        db.commit()
        db.close()
        return {"message": "Missing person deleted successfully"}
    
    # If neither found
    db.close()
    raise HTTPException(status_code=404, detail="Case or missing person not found")

@router.post("/{case_id}/photo", response_model=CaseRead)
def upload_case_photo(
    case_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Validate image type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"case_{case_id}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    case.photo_path = filepath
    db.commit()
    db.refresh(case)
    return case

@router.get("/{case_id}/photo")
def get_case_photo(
    case_id: int,
    db: Session = Depends(get_db)
):
    """Get case suspect photo (public access)"""
    case = db.query(Case).filter(Case.id == case_id).first()
    
    # Try multiple path strategies to find the photo
    path_variants = []
    
    # 1. Use the database path if case exists
    if case and case.photo_path:
        original_path = case.photo_path.replace('\\', '/')
        path_variants.append(original_path)
        
        # Add backend prefix if not present
        if not original_path.startswith('backend/'):
            path_variants.append(f"backend/{original_path}")
        
        # Remove backend prefix if present (for when running from backend dir)
        if original_path.startswith('backend/'):
            path_variants.append(original_path[8:])
    
    # 2. Try standard naming patterns (even if case doesn't exist in DB)
    path_variants.extend([
        f"uploads/cases/case_{case_id}.jpg",
        f"uploads/cases/case_{case_id}.jpeg",
        f"uploads/cases/case_{case_id}.png",
        f"backend/uploads/cases/case_{case_id}.jpg",
        f"backend/uploads/cases/case_{case_id}.jpeg",
        f"backend/uploads/cases/case_{case_id}.png"
    ])
    
    # Remove duplicates and check each path
    unique_paths = list(set(path_variants))
    actual_file_path = None
    
    for path in unique_paths:
        if os.path.exists(path):
            actual_file_path = path
            break
    
    if not actual_file_path:
        print(f"❌ CASE PHOTO NOT FOUND for case {case_id}. Tried paths:")
        for path in unique_paths:
            print(f"  - {path}")
        
        # Return default image instead of 404
        default_path = "backend/uploads/default-profile.png"
        if os.path.exists(default_path):
            print(f"✅ Returning default image: {default_path}")
            from fastapi.responses import FileResponse
            return FileResponse(default_path)
        else:
            raise HTTPException(status_code=404, detail="Photo file not found")
    
    print(f"✅ CASE PHOTO FOUND: {actual_file_path}")
    
    # Verify file is not empty or too small
    if os.path.getsize(actual_file_path) < 100:
        print(f"⚠️  File is very small ({os.path.getsize(actual_file_path)} bytes)")
    
    from fastapi.responses import FileResponse
    return FileResponse(actual_file_path)
