from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class AlertLog(Base):
    __tablename__ = "alert_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    police_station_id = Column(Integer, ForeignKey("police_stations.id"), nullable=True)
    police_station_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    case_details = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, nullable=False, default="sent")  # sent/failed
    
    # Relationships
    police_station = relationship("PoliceStation", back_populates="alert_logs")
    camera = relationship("Camera", back_populates="alert_logs")
