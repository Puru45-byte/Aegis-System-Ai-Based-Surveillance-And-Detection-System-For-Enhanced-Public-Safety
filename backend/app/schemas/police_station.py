from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

class PoliceStationCreate(BaseModel):
    name: str
    address: str
    city: str
    state: str
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PoliceStationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PoliceStationResponse(BaseModel):
    id: int
    name: str
    address: str
    city: str
    state: str
    contact_number: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class PoliceStationNearby(BaseModel):
    id: int
    name: str
    address: str
    city: str
    state: str
    contact_number: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: float
    
    class Config:
        from_attributes = True
