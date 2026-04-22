from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_db, get_current_active_admin
from app.models.camera import Camera
from app.core.camera_stream import generate_mjpeg_frames, release_camera_stream

router = APIRouter()

class CameraCreate(BaseModel):
    name: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rtsp_url: str
    is_active: bool = True

class CameraRead(CameraCreate):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=List[CameraRead])
def list_cameras(db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    return db.query(Camera).all()

@router.post("/", response_model=CameraRead)
def add_camera(cam_in: CameraCreate, db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    cam = Camera(**cam_in.dict())
    db.add(cam)
    db.commit()
    db.refresh(cam)
    return cam

@router.put("/{cam_id}", response_model=CameraRead)
def update_camera(cam_id: int, cam_in: CameraCreate, db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    cam = db.query(Camera).filter(Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    for key, value in cam_in.dict().items():
        setattr(cam, key, value)
    db.commit()
    db.refresh(cam)
    return cam

@router.delete("/{cam_id}")
def delete_camera(cam_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    cam = db.query(Camera).filter(Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    db.delete(cam)
    db.commit()
    return {"message": "Camera removed"}

@router.post("/live-scan")
async def live_scan(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin)
):
    """
    Process live scan from uploaded frame
    """
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read uploaded frame
        contents = await file.read()
        import numpy as np
        import cv2
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Process frame for face detection
        from app.core.camera_stream import save_face_detection
        import face_recognition
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
        if face_encodings:
            # Save first detected face
            save_face_detection(1, face_encodings[0], db, "Live Scan Camera")
            return {"message": f"Face detected and logged", "faces_found": len(face_encodings)}
        
        return {"message": "No faces detected", "faces_found": 0}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Live scan error: {e}")
        raise HTTPException(status_code=500, detail=f"Live scan failed: {str(e)}")

@router.get("/{cam_id}/stream")
def stream_camera(cam_id: int, db: Session = Depends(get_db)):
    """Stream live MJPEG from an IP camera. Use in <img src='...'> tags."""
    cam = db.query(Camera).filter(Camera.id == cam_id, Camera.is_active == True).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found or inactive")
    
    return StreamingResponse(
        generate_mjpeg_frames(cam_id, cam.rtsp_url, cam.location, db),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
