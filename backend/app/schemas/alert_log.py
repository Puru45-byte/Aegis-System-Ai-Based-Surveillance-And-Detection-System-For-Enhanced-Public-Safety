from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AlertLogBase(BaseModel):
    police_station_id: Optional[int] = None
    police_station_name: str
    email: str
    camera_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    case_details: Optional[str] = None
    status: str = "sent"

class AlertLogCreate(AlertLogBase):
    pass

class AlertLogRead(AlertLogBase):
    id: int
    sent_at: datetime
    
    class Config:
        from_attributes = True
