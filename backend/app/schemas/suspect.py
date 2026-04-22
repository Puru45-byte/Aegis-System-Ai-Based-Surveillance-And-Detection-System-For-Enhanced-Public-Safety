from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.suspect import CaseStatus, ThreatLevel

class CaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    suspect_name: Optional[str] = None
    location: Optional[str] = None
    threat_level: ThreatLevel = ThreatLevel.MEDIUM
    status: CaseStatus = CaseStatus.ACTIVE
    photo_path: Optional[str] = None

class CaseCreate(CaseBase):
    pass

class CaseUpdate(CaseBase):
    title: Optional[str] = None
    status: Optional[CaseStatus] = None
    threat_level: Optional[ThreatLevel] = None

class CaseRead(CaseBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    photo_path: Optional[str] = None
    class Config:
        from_attributes = True

# ---- Surveillance Log ----
class SurveillanceLogRead(BaseModel):
    id: int
    person_name: Optional[str]
    camera_location: str
    confidence_score: Optional[float]
    confidence_level: str
    notes: Optional[str]
    detected_at: datetime
    class Config:
        from_attributes = True

# ---- Tip ----
class TipCreate(BaseModel):
    submitted_by: Optional[str] = "Anonymous"
    title: str
    content: str

class TipRead(BaseModel):
    id: int
    submitted_by: Optional[str]
    title: str
    content: str
    is_reviewed: bool
    submitted_at: datetime
    class Config:
        from_attributes = True
