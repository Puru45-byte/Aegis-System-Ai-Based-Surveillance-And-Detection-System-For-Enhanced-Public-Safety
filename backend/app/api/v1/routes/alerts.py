from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_admin
from app.models.detection_log import SurveillanceLog
from app.schemas.suspect import SurveillanceLogRead

router = APIRouter()

@router.get("/", response_model=List[SurveillanceLogRead])
def get_surveillance_logs(db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    return db.query(SurveillanceLog).order_by(SurveillanceLog.detected_at.desc()).all()
