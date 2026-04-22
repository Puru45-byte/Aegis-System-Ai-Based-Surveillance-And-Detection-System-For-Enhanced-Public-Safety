from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, text

from app.api.deps import get_db, get_current_user, get_current_active_admin
from app.models.tip import Tip
from app.models.user import User
from app.schemas.tip import TipCreate, TipUpdate, TipRead

router = APIRouter()

@router.post("/", response_model=TipRead)
def create_tip(
    tip_in: TipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new tip (any authenticated user can submit)"""
    try:
        print(f"🔍 DEBUG: Creating tip with data: {tip_in}")
        
        # Validate required fields
        if not tip_in.description or not tip_in.description.strip():
            raise HTTPException(
                status_code=422,
                detail=[{"msg": "Description cannot be empty", "type": "value_error", "loc": ["body", "description"]}]
            )
        
        # Generate title from available fields
        title = tip_in.get_title()
        print(f"🔍 DEBUG: Generated title: {title}")
        
        # Create rich content with all tip details
        import json
        tip_details = {
            "description": tip_in.description.strip(),
            "tip_type": tip_in.tip_type,
            "subject_name": tip_in.subject_name,
            "location": tip_in.location,
            "contact_name": tip_in.contact_name,
            "contact_phone": tip_in.contact_phone,
            "contact_email": tip_in.contact_email,
            "is_anonymous": tip_in.is_anonymous,
            "suspect_id": tip_in.suspect_id,
            "submitted_by": current_user.id if current_user else None
        }
        
        # Store as formatted content for display
        content_lines = [f"Description: {tip_details['description']}"]
        if tip_details['subject_name']:
            content_lines.append(f"Subject: {tip_details['subject_name']}")
        if tip_details['location']:
            content_lines.append(f"Location: {tip_details['location']}")
        if tip_details['tip_type']:
            content_lines.append(f"Type: {tip_details['tip_type']}")
        if tip_details['suspect_id']:
            content_lines.append(f"Case ID: {tip_details['suspect_id']}")
        
        content = "\n".join(content_lines)
        
        print(f"🔍 DEBUG: Content: {content}")
        
        # Create tip with both title and content (CRITICAL FIX)
        tip = Tip(
            title=title,
            content=content  # 🔥 Store formatted content with all details
        )
        db.add(tip)
        db.commit()
        db.refresh(tip)
        print(f"✅ DEBUG: Tip created successfully: {tip.id}")
        
        # Return parsed tip for frontend compatibility
        return TipRead.from_tip_model(tip)
            
    except HTTPException:
        # Re-raise HTTP exceptions (validation errors) as-is
        raise
    except Exception as e:
        print(f"❌ DEBUG: Error creating tip: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=422, 
            detail=[{"msg": f"Server error: {str(e)}", "type": "server_error"}]
        )

@router.get("/", response_model=List[TipRead])
def get_tips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Get all tips (admin only)"""
    try:
        # Simple query using only existing columns
        tips = db.query(Tip).order_by(Tip.id.desc()).all()
        print(f"✅ DEBUG: Found {len(tips)} tips")
        
        # Convert to TipRead with parsed fields for frontend compatibility
        tip_reads = []
        for tip in tips:
            tip_read = TipRead.from_tip_model(tip)
            tip_reads.append(tip_read)
            print(f"🔍 DEBUG: Tip {tip.id} - {tip_read.tip_type} - {tip_read.subject_name}")
        
        return tip_reads
    except Exception as e:
        print(f"❌ DEBUG: Error fetching tips: {e}")
        import traceback
        traceback.print_exc()
        return []

@router.get("/{tip_id}", response_model=TipRead)
def get_tip(
    tip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Get a specific tip (admin only)"""
    tip = db.query(Tip).filter(Tip.id == tip_id).first()
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    # Return parsed tip for frontend compatibility
    return TipRead.from_tip_model(tip)

@router.patch("/{tip_id}/review", response_model=TipRead)
def mark_tip_reviewed(
    tip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Mark a tip as reviewed (admin only)"""
    tip = db.query(Tip).filter(Tip.id == tip_id).first()
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    tip.status = "reviewed"
    db.commit()
    db.refresh(tip)
    return tip

@router.put("/{tip_id}", response_model=TipRead)
def update_tip(
    tip_id: int,
    tip_in: TipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Update a tip (admin only)"""
    tip = db.query(Tip).filter(Tip.id == tip_id).first()
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    for field, value in tip_in.model_dump(exclude_unset=True).items():
        setattr(tip, field, value)
    
    db.commit()
    db.refresh(tip)
    return tip

@router.delete("/{tip_id}")
def delete_tip(
    tip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Delete a tip (admin only)"""
    tip = db.query(Tip).filter(Tip.id == tip_id).first()
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    db.delete(tip)
    db.commit()
    return {"message": "Tip deleted successfully"}
