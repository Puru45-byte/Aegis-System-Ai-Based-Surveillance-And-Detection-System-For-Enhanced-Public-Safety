from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from app.api.deps import get_db, get_current_active_admin
from app.models.camera import Camera
from app.models.detection_log import SurveillanceLog, DetectionConfidence
from app.models.missing_person import MissingPerson

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin)
):
    today = datetime.now(timezone.utc).date()

    active_cams = db.query(func.count(Camera.id)).filter(Camera.is_active == True).scalar() or 0

    daily_scans = (
        db.query(func.count(SurveillanceLog.id))
        .filter(cast(SurveillanceLog.detected_at, Date) == today)
        .scalar() or 0
    )

    matches_today = (
        db.query(func.count(SurveillanceLog.id))
        .filter(
            cast(SurveillanceLog.detected_at, Date) == today,
            SurveillanceLog.confidence_level == DetectionConfidence.HIGH
        )
        .scalar() or 0
    )

    low_confidence_today = (
        db.query(func.count(SurveillanceLog.id))
        .filter(
            cast(SurveillanceLog.detected_at, Date) == today,
            SurveillanceLog.confidence_level == DetectionConfidence.LOW
        )
        .scalar() or 0
    )

    critical_alerts = (
        db.query(func.count(SurveillanceLog.id))
        .filter(
            cast(SurveillanceLog.detected_at, Date) == today,
            SurveillanceLog.confidence_level == DetectionConfidence.HIGH,
            SurveillanceLog.person_name.isnot(None)
        )
        .scalar() or 0
    )

    # Count pending missing person requests
    pending_missing_persons = (
        db.query(func.count(MissingPerson.id))
        .filter(MissingPerson.status == "pending")
        .scalar() or 0
    )

    return {
        "active_cams": active_cams,
        "daily_scans": daily_scans,
        "matches_today": matches_today,
        "low_confidence_today": low_confidence_today,
        "critical_alerts": critical_alerts,
        "pending_missing_persons": pending_missing_persons,
    }

@router.get("/pending-missing-persons")
def get_pending_missing_persons_for_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin)
):
    """Get pending missing person requests for dashboard display"""
    pending_requests = db.query(MissingPerson).filter(
        MissingPerson.status == "pending"
    ).order_by(MissingPerson.created_at.desc()).limit(10).all()
    
    return [
        {
            "id": req.id,
            "missing_person_name": req.missing_person_name,
            "last_seen_location": req.last_seen_location,
            "last_seen_date": req.last_seen_date.strftime("%Y-%m-%d") if req.last_seen_date else None,
            "contact_phone": req.contact_phone,
            "created_at": req.created_at.strftime("%Y-%m-%d %H:%M") if req.created_at else None,
            "photo_path": req.photo_path
        }
        for req in pending_requests
    ]
