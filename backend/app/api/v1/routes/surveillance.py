from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc

# Simple imports to avoid circular dependencies
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.detection_log import SurveillanceLog
from app.schemas.detection import SurveillanceLogRead, SurveillanceLogCreate
from app.services.alert_service import alert_service

router = APIRouter()

@router.get("/surveillance-logs", response_model=List[SurveillanceLogRead])
def get_surveillance_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get surveillance logs with pagination - using SQLAlchemy ORM
    """
    try:
        logs = db.query(SurveillanceLog)\
            .order_by(desc(SurveillanceLog.detected_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        # Convert to Pydantic models for proper serialization
        return [SurveillanceLogRead.model_validate(log.__dict__) for log in logs]
        
    except Exception as e:
        print(f"Error fetching surveillance logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Surveillance logs fetch failed: {str(e)}"
        )

@router.get("/surveillance-logs/recent", response_model=List[SurveillanceLogRead])
def get_recent_surveillance_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10
) -> Any:
    """
    Get most recent surveillance logs
    """
    try:
        logs = db.query(SurveillanceLog)\
            .order_by(desc(SurveillanceLog.detected_at))\
            .limit(limit)\
            .all()
        
        # Convert to Pydantic models for proper serialization
        return [SurveillanceLogRead.model_validate(log.__dict__) for log in logs]
        
    except Exception as e:
        print(f"Error fetching recent surveillance logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recent surveillance logs fetch failed: {str(e)}"
        )

@router.post("/surveillance-logs", response_model=SurveillanceLogRead)
def create_surveillance_log(
    log_data: SurveillanceLogCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a new surveillance log and send alert in background
    """
    try:
        # Create new surveillance log
        new_log = SurveillanceLog(**log_data.dict())
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        
        # Add background task to send alert
        background_tasks.add_task(alert_service.send_alert, new_log.id, db)
        
        print(f"✅ Created surveillance log ID {new_log.id} with alert task")
        
        return SurveillanceLogRead.model_validate(new_log.__dict__)
        
    except Exception as e:
        print(f"Error creating surveillance log: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create surveillance log: {str(e)}"
        )

@router.delete("/surveillance-logs/{log_id}")
def delete_surveillance_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete a surveillance log entry
    """
    try:
        # Find the log entry
        log = db.query(SurveillanceLog).filter(SurveillanceLog.id == log_id).first()
        
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Surveillance log with ID {log_id} not found"
            )
        
        # Delete the log entry
        db.delete(log)
        db.commit()
        
        print(f"✅ Successfully deleted surveillance log ID {log_id}")
        
        return {"message": f"Surveillance log {log_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting surveillance log {log_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete surveillance log: {str(e)}"
        )
