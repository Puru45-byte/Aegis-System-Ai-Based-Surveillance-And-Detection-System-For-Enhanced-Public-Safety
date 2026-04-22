import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class DetectionConfidence(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class MatchType(str, enum.Enum):
    MISSING = "missing"
    CRIMINAL = "criminal"
    TERRORIST = "terrorist"
    UNKNOWN = "unknown"
    PROCESSING = "processing"

class SurveillanceLog(Base):
    __tablename__ = "surveillance_logs"
    id = Column(Integer, primary_key=True, index=True)
    person_name = Column(String, nullable=True)
    camera_id = Column(Integer, nullable=True)  # NEW: Link to camera
    camera_location = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=True)
    confidence_level = Column(Enum(DetectionConfidence), default=DetectionConfidence.LOW)
    snapshot_path = Column(String, nullable=True)   # path to saved frame
    notes = Column(Text, nullable=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # NEW: Enhanced detection fields
    match_type = Column(Enum(MatchType), default=MatchType.UNKNOWN)
    person_id = Column(Integer, nullable=True)  # Link to matched person (missing/criminal)
    image_path = Column(String, nullable=True)  # Additional image path for snapshots
