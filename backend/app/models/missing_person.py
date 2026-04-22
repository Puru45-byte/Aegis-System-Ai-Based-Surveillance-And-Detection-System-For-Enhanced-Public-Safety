from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, LargeBinary
from sqlalchemy.sql import func
from app.db.base import Base

class MissingPerson(Base):
    __tablename__ = "missing_persons"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    
    # Missing person details
    missing_person_name = Column(String(255), nullable=False)
    age = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    height = Column(String(50), nullable=True)
    weight = Column(String(50), nullable=True)
    hair_color = Column(String(50), nullable=True)
    eye_color = Column(String(50), nullable=True)
    clothing_description = Column(Text, nullable=True)
    medical_conditions = Column(Text, nullable=True)
    
    # Last seen information
    last_seen_location = Column(String(255), nullable=False)
    last_seen_date = Column(DateTime(timezone=True), nullable=False)
    last_seen_time = Column(String(20), nullable=True)
    circumstances = Column(Text, nullable=True)
    
    # Photo
    photo_path = Column(String(500), nullable=True)
    face_encoding = Column(LargeBinary, nullable=True)  # Store pre-computed face encoding
    encoding_updated_at = Column(DateTime(timezone=True), nullable=True)  # Track when encoding was computed
    
    # Contact information
    contact_name = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=False)
    contact_email = Column(String(255), nullable=True)
    relationship_to_missing = Column(String(100), nullable=True)
    is_anonymous = Column(Boolean, default=False)
    
    # Workflow and approval fields - temporarily removed to fix database issues
    # approval_status = Column(String(20), default="pending")  # pending, approved, rejected
    # approved_by = Column(Integer, nullable=True)  # Remove foreign key for now
    # approved_at = Column(DateTime(timezone=True), nullable=True)
    # rejection_reason = Column(Text, nullable=True)
    # converted_to_case = Column(Boolean, default=False)
    # case_id = Column(Integer, nullable=True)  # Remove foreign key for now
    
    # Status and timestamps
    status = Column(String(20), default="pending")  # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
