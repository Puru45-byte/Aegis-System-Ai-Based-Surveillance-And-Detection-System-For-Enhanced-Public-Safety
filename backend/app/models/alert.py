from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.base import Base

class Tip(Base):
    __tablename__ = "tips"
    id = Column(Integer, primary_key=True, index=True)
    submitted_by = Column(String, nullable=True)    # could be anonymous
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_reviewed = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
