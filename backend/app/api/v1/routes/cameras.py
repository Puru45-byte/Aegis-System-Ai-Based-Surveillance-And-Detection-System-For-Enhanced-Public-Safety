from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.camera import CameraCreate, CameraUpdate, CameraResponse
from app.models.camera import Camera

router = APIRouter()

@router.post("/cameras", response_model=CameraResponse)
def create_camera(camera: CameraCreate, db: Session = Depends(get_db)):
    db_camera = Camera(**camera.dict())
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera

@router.get("/cameras", response_model=List[CameraResponse])
def get_cameras(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    cameras = db.query(Camera).offset(skip).limit(limit).all()
    return cameras

@router.get("/cameras/{camera_id}", response_model=CameraResponse)
def get_camera(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

@router.put("/cameras/{camera_id}", response_model=CameraResponse)
def update_camera(camera_id: int, camera_update: CameraUpdate, db: Session = Depends(get_db)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    update_data = camera_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(camera, field, value)
    
    db.commit()
    db.refresh(camera)
    return camera

@router.delete("/cameras/{camera_id}")
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    db.delete(camera)
    db.commit()
    return {"message": "Camera deleted successfully"}
