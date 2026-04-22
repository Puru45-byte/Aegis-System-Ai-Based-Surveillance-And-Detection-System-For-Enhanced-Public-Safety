from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.email_service import email_service

router = APIRouter()

class TestEmailRequest(BaseModel):
    recipient_email: str = "patilpushkar199@gmail.com"

@router.post("/test-email")
def test_email_sending(
    request: TestEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Test email sending functionality
    Sends a test email to verify real email delivery
    """
    try:
        # Send test email
        success = email_service.send_alert_email(
            recipient_email=request.recipient_email,
            police_station_name="Test Police Station",
            camera_location="Test Location (18.755368, 73.668131)",
            latitude=18.755368,
            longitude=73.668131,
            case_details=f"""
Person Detected: Test Person
Confidence Score: 85.00
Match Type: CRIMINAL
Detected At: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Notes: This is a test email from Aegis System
Camera Location: Test Location
Camera ID: 999
            """.strip(),
            camera_id=999
        )
        
        if success:
            return {
                "status": "success",
                "message": f"Test email sent successfully to {request.recipient_email}",
                "sender": "aegissystem.help@gmail.com",
                "recipient": request.recipient_email
            }
        else:
            return {
                "status": "failed",
                "message": f"Failed to send test email to {request.recipient_email}",
                "sender": "aegissystem.help@gmail.com",
                "recipient": request.recipient_email,
                "error": "Check server logs for detailed error information"
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test email failed: {str(e)}"
        )
