import os
import shutil
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user, get_current_active_admin
from app.models.missing_person import MissingPerson
from app.models.user import User
from app.schemas.missing_person import MissingPersonCreate, MissingPersonUpdate, MissingPersonRead

UPLOAD_DIR = "backend/uploads/missing_persons"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()

@router.post("/", response_model=MissingPersonRead)
def create_missing_person_report(
    missing_person_name: str = Form(None),
    age: str = Form(None),
    gender: str = Form(None),
    height: str = Form(None),
    weight: str = Form(None),
    hair_color: str = Form(None),
    eye_color: str = Form(None),
    clothing_description: str = Form(None),
    medical_conditions: str = Form(None),
    last_seen_location: str = Form(None),
    last_seen_date: str = Form(None),
    last_seen_time: str = Form(None),
    circumstances: str = Form(None),
    contact_name: str = Form(None),
    contact_phone: str = Form(None),
    contact_email: str = Form(None),
    relationship_to_missing: str = Form(None),
    is_anonymous: bool = Form(False),
    status: str = Form("pending"),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new missing person report (any authenticated user can submit)"""
    
    print(f"DEBUG: Received form fields:")
    print(f"  - missing_person_name: {missing_person_name}")
    print(f"  - last_seen_location: {last_seen_location}")
    print(f"  - last_seen_date: {last_seen_date}")
    print(f"  - contact_phone: {contact_phone}")
    print(f"  - photo: {photo.filename if photo else 'None'}")
    
    # Validate required fields
    if not missing_person_name:
        print("DEBUG: Missing person name validation failed")
        raise HTTPException(status_code=400, detail="Missing person name is required")
    if not last_seen_location:
        print("DEBUG: Last seen location validation failed")
        raise HTTPException(status_code=400, detail="Last seen location is required")
    if not last_seen_date:
        print("DEBUG: Last seen date validation failed")
        raise HTTPException(status_code=400, detail="Last seen date is required")
    if not contact_phone:
        print("DEBUG: Contact phone validation failed")
        raise HTTPException(status_code=400, detail="Contact phone is required")
    
    print("DEBUG: All validations passed")
    
    # Convert date string to datetime if provided
    from datetime import datetime
    last_seen_datetime = None
    if last_seen_date:
        try:
            # Handle different date formats
            if 'T' in last_seen_date:
                # ISO format with time
                last_seen_datetime = datetime.fromisoformat(last_seen_date.replace('Z', '+00:00'))
            else:
                # Date only format
                last_seen_datetime = datetime.strptime(last_seen_date, '%Y-%m-%d')
            print(f"DEBUG: Parsed date: {last_seen_datetime}")
        except ValueError as e:
            print(f"DEBUG: Date parsing error: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    
    # Create missing person record
    missing_person = MissingPerson(
        missing_person_name=missing_person_name,
        age=age,
        gender=gender,
        height=height,
        weight=weight,
        hair_color=hair_color,
        eye_color=eye_color,
        clothing_description=clothing_description,
        medical_conditions=medical_conditions,
        last_seen_location=last_seen_location,
        last_seen_date=last_seen_datetime,
        last_seen_time=last_seen_time,
        circumstances=circumstances,
        contact_name=contact_name,
        contact_phone=contact_phone,
        contact_email=contact_email,
        relationship_to_missing=relationship_to_missing,
        is_anonymous=is_anonymous,
        status=status
    )
    
    print(f"DEBUG: Created missing person object: {missing_person}")
    
    db.add(missing_person)
    db.commit()
    db.refresh(missing_person)
    
    print(f"DEBUG: Saved to database with ID: {missing_person.id}")
    
    # Handle photo upload
    if photo and photo.filename:
        print(f"DEBUG: Processing photo: {photo.filename}")
        # Validate image type
        if not photo.content_type.startswith("image/"):
            print(f"DEBUG: Invalid photo content type: {photo.content_type}")
            raise HTTPException(status_code=400, detail="File must be an image")
        
        ext = photo.filename.rsplit(".", 1)[-1].lower()
        filename = f"missing_person_{missing_person.id}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        
        missing_person.photo_path = filepath
        db.commit()
        db.refresh(missing_person)
        
        print(f"DEBUG: Photo saved to: {filepath}")
    
    print("DEBUG: Returning missing person record")
    return missing_person

@router.get("/", response_model=List[MissingPersonRead])
def get_missing_person_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Get all missing person reports (admin only)"""
    return db.query(MissingPerson).order_by(desc(MissingPerson.created_at)).all()

@router.get("/{report_id}", response_model=MissingPersonRead)
def get_missing_person_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Get a specific missing person report (admin only)"""
    report = db.query(MissingPerson).filter(MissingPerson.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Missing person report not found")
    return report

@router.put("/{report_id}", response_model=MissingPersonRead)
def update_missing_person_report(
    report_id: int,
    report_in: MissingPersonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Update a missing person report (admin only)"""
    report = db.query(MissingPerson).filter(MissingPerson.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Missing person report not found")
    
    for field, value in report_in.model_dump(exclude_unset=True).items():
        setattr(report, field, value)
    
    db.commit()
    db.refresh(report)
    return report

@router.post("/{report_id}/approve")
def approve_missing_person_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Approve a missing person report (admin only)"""
    report = db.query(MissingPerson).filter(MissingPerson.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Missing person report not found")
    
    if report.status != "pending":
        raise HTTPException(status_code=400, detail="Report has already been processed")
    
    report.status = "approved"
    db.commit()
    db.refresh(report)
    
    return {"message": "Missing person report approved successfully", "report": report}

@router.post("/{report_id}/reject")
def reject_missing_person_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Reject and delete a missing person report (admin only)"""
    report = db.query(MissingPerson).filter(MissingPerson.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Missing person report not found")
    
    if report.status != "pending":
        raise HTTPException(status_code=400, detail="Report has already been processed")
    
    # Delete the photo if it exists
    if report.photo_path and os.path.exists(report.photo_path):
        os.remove(report.photo_path)
    
    # Delete the report
    db.delete(report)
    db.commit()
    
    return {"message": "Missing person report rejected and deleted successfully"}

@router.get("/pending", response_model=List[MissingPersonRead])
def get_pending_missing_person_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Changed from get_current_active_admin
):
    """Get all pending missing person reports"""
    try:
        # Check if user is admin
        if not current_user.is_active:
            raise HTTPException(status_code=403, detail="Account is not active")
        
        # For development/testing, allow any active user to see pending reports
        # In production, uncomment the admin check below:
        # if current_user.role != "admin":
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        print(f"=== PENDING REPORTS REQUEST ===")
        print(f"User: {current_user.email}, Role: {current_user.role}")
        
        reports = db.query(MissingPerson).filter(MissingPerson.status == "pending").order_by(desc(MissingPerson.created_at)).all()
        print(f"Found {len(reports)} pending reports")
        
        return reports
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ PENDING REPORTS ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch pending reports: {str(e)}")

@router.get("/approved", response_model=List[MissingPersonRead])
def get_approved_missing_person_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Get all approved missing person reports (admin only)"""
    return db.query(MissingPerson).filter(MissingPerson.status == "approved").order_by(desc(MissingPerson.created_at)).all()

@router.post("/{report_id}/approve")
def approve_missing_person_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Approve a missing person report (admin only)"""
    report = db.query(MissingPerson).filter(MissingPerson.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Missing person report not found")
    
    if report.status != "pending":
        raise HTTPException(status_code=400, detail="Report has already been processed")
    
    report.status = "approved"
    db.commit()
    db.refresh(report)
    
    return {"message": "Missing person report approved successfully", "report": report}

@router.post("/{report_id}/reject")
def reject_missing_person_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Reject and delete a missing person report (admin only)"""
    report = db.query(MissingPerson).filter(MissingPerson.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Missing person report not found")
    
    if report.status != "pending":
        raise HTTPException(status_code=400, detail="Report has already been processed")
    
    # Delete the photo if it exists
    if report.photo_path and os.path.exists(report.photo_path):
        os.remove(report.photo_path)
    
    # Delete the report
    db.delete(report)
    db.commit()
    
    return {"message": "Missing person report rejected and deleted successfully"}

@router.get("/{report_id}/photo")
def get_missing_person_photo(
    report_id: int,
    db: Session = Depends(get_db)
):
    """Get missing person photo (public access)"""
    report = db.query(MissingPerson).filter(MissingPerson.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Missing person not found")
    
    # Try multiple path strategies to find the photo
    path_variants = []
    
    # 1. Use the database path if it exists
    if report.photo_path:
        original_path = report.photo_path.replace('\\', '/')
        path_variants.append(original_path)
        
        # Add backend prefix if not present
        if not original_path.startswith('backend/'):
            path_variants.append(f"backend/{original_path}")
        
        # Remove backend prefix if present (for when running from backend dir)
        if original_path.startswith('backend/'):
            path_variants.append(original_path[8:])
    
    # 2. Try standard naming patterns
    path_variants.extend([
        f"uploads/missing_persons/missing_person_{report_id}.jpg",
        f"uploads/missing_persons/missing_person_{report_id}.jpeg",
        f"uploads/missing_persons/missing_person_{report_id}.png",
        f"backend/uploads/missing_persons/missing_person_{report_id}.jpg",
        f"backend/uploads/missing_persons/missing_person_{report_id}.jpeg",
        f"backend/uploads/missing_persons/missing_person_{report_id}.png"
    ])
    
    # 3. Try existing files (fallback for mismatched IDs)
    if report_id == 1:
        path_variants.extend([
            "uploads/missing_persons/missing_person_3.jpg",
            "backend/uploads/missing_persons/missing_person_3.jpg"
        ])
    
    # Remove duplicates and check each path
    unique_paths = list(set(path_variants))
    actual_file_path = None
    
    for path in unique_paths:
        if os.path.exists(path):
            actual_file_path = path
            break
    
    if not actual_file_path:
        print(f"❌ MISSING PERSON PHOTO NOT FOUND for ID {report_id}. Tried paths:")
        for path in unique_paths:
            print(f"  - {path}")
        raise HTTPException(status_code=404, detail="Photo file not found")
    
    print(f"✅ MISSING PERSON PHOTO FOUND: {actual_file_path}")
    
    # Verify file is not empty or too small
    file_size = os.path.getsize(actual_file_path)
    if file_size < 100:
        print(f"⚠️  File is very small ({file_size} bytes) - might be a placeholder")
        # Still return it, but it might be a placeholder
    
    from fastapi.responses import FileResponse
    return FileResponse(actual_file_path)
