from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.detection_log import DetectionConfidence, MatchType

class SurveillanceLogBase(BaseModel):
    person_name: Optional[str] = None
    camera_id: Optional[int] = None
    camera_location: str
    confidence_score: Optional[float] = None
    confidence_level: DetectionConfidence = DetectionConfidence.LOW
    snapshot_path: Optional[str] = None
    notes: Optional[str] = None
    match_type: MatchType = MatchType.UNKNOWN
    person_id: Optional[int] = None
    image_path: Optional[str] = None

class SurveillanceLogCreate(SurveillanceLogBase):
    pass

class SurveillanceLogRead(SurveillanceLogBase):
    id: int
    detected_at: datetime
    
    class Config:
        from_attributes = True

class FaceDetectionRequest(BaseModel):
    camera_id: int
    image_data: str  # base64 encoded image

class FaceDetectionResponse(BaseModel):
    face_detected: bool
    person_name: Optional[str] = None
    confidence_score: Optional[float] = None
    confidence_level: DetectionConfidence
    snapshot_path: Optional[str] = None
    log_entry_id: Optional[int] = None