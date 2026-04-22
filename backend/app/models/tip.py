from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Tip(Base):
    __tablename__ = "tips"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)  # NOT NULL - required field
    content = Column(Text, nullable=False)  # NOT NULL - required field (FIXED)
    status = Column(String(20), default="pending")  # Add status column
    # Store additional info as JSON in content or add more columns if they exist
    
    # Temporarily disable suspect relationship to fix SQLAlchemy issue
    # suspect = relationship("app.models.suspect.Case", back_populates="tips")
