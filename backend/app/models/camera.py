from sqlalchemy import Column, Integer, String, Boolean, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    rtsp_url = Column(String, nullable=False)   # e.g. rtsp://user:pass@192.168.1.10:554/stream1
    is_active = Column(Boolean, default=True)
    
    # Relationships
    alert_logs = relationship("AlertLog", back_populates="camera")
