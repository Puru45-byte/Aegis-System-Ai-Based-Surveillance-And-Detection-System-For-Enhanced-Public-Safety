import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587  # Use TLS port
        self.sender_email = "aegissystem.help@gmail.com"
        self.sender_password = "bevb crrk grcu uxmc"  # New Gmail App Password
    
    def send_alert_email(
        self,
        recipient_email: str,
        police_station_name: str,
        camera_location: str,
        latitude: float,
        longitude: float,
        case_details: str,
        camera_id: int
    ) -> bool:
        """
        Send alert email to police station
        Returns True if email is actually sent, False if it fails
        """
        try:
            # Validate email
            if not recipient_email or '@' not in recipient_email:
                logger.error(f"Invalid recipient email: {recipient_email}")
                return False
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = "🚨 Suspicious Activity Detected"
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            # Create email body
            detected_at = "Unknown"
            if isinstance(case_details, dict):
                detected_at = case_details.get('detected_at', 'Unknown')
            elif isinstance(case_details, str):
                if "Detected At:" in case_details:
                    lines = case_details.split('\n')
                    for line in lines:
                        if "Detected At:" in line:
                            detected_at = line.split("Detected At:")[1].strip()
                            break
            
            body = f"""
ALERT: Suspicious Activity Detected

Police Station: {police_station_name}
Camera Location: {camera_location}
Coordinates: {latitude}, {longitude}
Camera ID: {camera_id}
Time: {detected_at}

Case Details:
{case_details}

This is an automated alert from the Aegis Surveillance System.
Please investigate the suspicious activity immediately.

---
Aegis System
Automated Surveillance Alert
            """.strip()
            
            # Attach body
            message.attach(MIMEText(body, "plain"))
            
            logger.info(f"📧 Sending email to {recipient_email}")
            
            # Create SMTP session with proper TLS configuration
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()  # Secure the connection
            
            # Login with proper error handling
            try:
                server.login(self.sender_email, self.sender_password)
                logger.info("✅ Gmail authentication successful")
            except smtplib.SMTPAuthenticationError as auth_error:
                logger.error(f"❌ Gmail authentication failed: {auth_error}")
                logger.error("🚨 Gmail authentication failed - check App Password or security settings")
                logger.error("� Solution: Enable 2-factor authentication and create an App Password")
                return False
            except Exception as login_error:
                logger.error(f"❌ Gmail login error: {login_error}")
                return False
            
            # Send email
            try:
                server.sendmail(self.sender_email, recipient_email, message.as_string())
                logger.info(f"✅ Email successfully sent to {recipient_email}")
                return True
            except smtplib.SMTPException as send_error:
                logger.error(f"❌ Failed to send email to {recipient_email}: {send_error}")
                return False
            finally:
                server.quit()
            
        except Exception as e:
            logger.error(f"❌ Email service error: {str(e)}")
            return False

# Global instance
email_service = EmailService()
