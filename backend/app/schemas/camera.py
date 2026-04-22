from typing import Optional
from pydantic import BaseModel

class CameraBase(BaseModel):
    name: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rtsp_url: str
    is_active: bool = True

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rtsp_url: Optional[str] = None
    is_active: Optional[bool] = None

class CameraResponse(CameraBase):
    id: int
    
    class Config:
        from_attributes = True
