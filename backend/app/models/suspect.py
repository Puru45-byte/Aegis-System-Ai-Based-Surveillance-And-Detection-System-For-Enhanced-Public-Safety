import enum
from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, Float, LargeBinary
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class CaseStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    PENDING = "pending"

class ThreatLevel(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    suspect_name = Column(String, nullable=True)
    location = Column(String, nullable=True)
    threat_level = Column(Enum(ThreatLevel), default=ThreatLevel.MEDIUM)
    status = Column(Enum(CaseStatus), default=CaseStatus.ACTIVE)
    photo_path = Column(String, nullable=True)   # path to uploaded subject photo
    face_encoding = Column(LargeBinary, nullable=True)  # Store pre-computed face encoding
    encoding_updated_at = Column(DateTime(timezone=True), nullable=True)  # Track when encoding was computed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Temporarily disable tips relationship to fix SQLAlchemy issue
    # tips = relationship("app.models.tip.Tip", back_populates="suspect")
