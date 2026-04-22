from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.alert_log import AlertLog
from app.schemas.alert_log import AlertLogRead

router = APIRouter()

@router.get("/alert-logs", response_model=List[AlertLogRead])
def get_alert_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get alert logs with pagination - sorted by latest first
    """
    try:
        logs = db.query(AlertLog)\
            .order_by(desc(AlertLog.sent_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        # Convert to Pydantic models for proper serialization
        return [AlertLogRead.model_validate(log.__dict__) for log in logs]
        
    except Exception as e:
        print(f"Error fetching alert logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alert logs fetch failed: {str(e)}"
        )

@router.get("/alert-logs/recent", response_model=List[AlertLogRead])
def get_recent_alert_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10
) -> Any:
    """
    Get most recent alert logs
    """
    try:
        logs = db.query(AlertLog)\
            .order_by(desc(AlertLog.sent_at))\
            .limit(limit)\
            .all()
        
        # Convert to Pydantic models for proper serialization
        return [AlertLogRead.model_validate(log.__dict__) for log in logs]
        
    except Exception as e:
        print(f"Error fetching recent alert logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recent alert logs fetch failed: {str(e)}"
        )

@router.delete("/alert-logs/{log_id}")
def delete_alert_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete an alert log
    """
    try:
        # Find the alert log
        alert_log = db.query(AlertLog).filter(AlertLog.id == log_id).first()
        
        if not alert_log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert log with ID {log_id} not found"
            )
        
        # Delete the alert log
        db.delete(alert_log)
        db.commit()
        
        print(f"✅ Successfully deleted alert log ID {log_id}")
        
        return {"message": f"Alert log {log_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting alert log {log_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete alert log: {str(e)}"
        )
