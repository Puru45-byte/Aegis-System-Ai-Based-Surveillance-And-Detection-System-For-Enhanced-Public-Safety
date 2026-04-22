import math
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.police_station import PoliceStation
from app.models.camera import Camera
from app.models.detection_log import SurveillanceLog
from app.models.alert_log import AlertLog
from app.services.email_service import email_service
import logging

logger = logging.getLogger(__name__)

class AlertService:
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points 
        on earth (specified in decimal degrees)
        Returns distance in kilometers
        """
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        return c * r
    
    @staticmethod
    def find_nearest_police_station(db: Session, latitude: float, longitude: float) -> Optional[PoliceStation]:
        """
        Find the nearest police station to given coordinates
        """
        try:
            police_stations = db.query(PoliceStation).filter(
                PoliceStation.latitude.isnot(None),
                PoliceStation.longitude.isnot(None),
                PoliceStation.email.isnot(None)
            ).all()
            
            if not police_stations:
                logger.warning("No police stations found with valid coordinates and email")
                return None
            
            nearest_station = None
            min_distance = float('inf')
            
            for station in police_stations:
                distance = AlertService.haversine_distance(
                    latitude, longitude,
                    station.latitude, station.longitude
                )
                
                if distance < min_distance:
                    min_distance = distance
                    nearest_station = station
            
            logger.info(f"Found nearest police station: {nearest_station.name} at {min_distance:.2f}km")
            return nearest_station
            
        except Exception as e:
            logger.error(f"Error finding nearest police station: {str(e)}")
            return None
    
    @staticmethod
    def send_alert(log_id: int, db: Session) -> bool:
        """
        Send alert for a surveillance log
        Returns True if successful, False otherwise
        """
        try:
            # Get surveillance log
            log = db.query(SurveillanceLog).filter(SurveillanceLog.id == log_id).first()
            if not log:
                logger.error(f"Surveillance log with ID {log_id} not found")
                return False
            
            # Get camera details
            camera = None
            camera_lat = None
            camera_lon = None
            camera_location = log.camera_location
            
            if log.camera_id:
                camera = db.query(Camera).filter(Camera.id == log.camera_id).first()
                if camera:
                    camera_lat = camera.latitude
                    camera_lon = camera.longitude
                    camera_location = camera.location or log.camera_location
            
            # If no camera coordinates, use default coordinates based on location or skip
            if not camera_lat or not camera_lon:
                logger.warning(f"No coordinates available for camera ID {log.camera_id}")
                
                # Try to extract coordinates from camera location string if it contains them
                if camera_location and ',' in camera_location:
                    try:
                        parts = camera_location.split(',')
                        if len(parts) == 2:
                            camera_lat = float(parts[0].strip())
                            camera_lon = float(parts[1].strip())
                            logger.info(f"Extracted coordinates from location: {camera_lat}, {camera_lon}")
                    except ValueError:
                        pass
                
                # If still no coordinates, use default coordinates (Mumbai)
                if not camera_lat or not camera_lon:
                    logger.info("Using default coordinates (Mumbai)")
                    camera_lat = 19.0760  # Mumbai latitude
                    camera_lon = 72.8777  # Mumbai longitude
                    camera_location = camera_location or f"Default Location ({camera_lat}, {camera_lon})"
            
            # Find nearest police station
            nearest_station = AlertService.find_nearest_police_station(db, camera_lat, camera_lon)
            if not nearest_station:
                logger.error("No suitable police station found for alert")
                # Create a fallback police station entry
                nearest_station = type('PoliceStation', (), {
                    'id': None,
                    'name': 'Default Police Station',
                    'email': 'police@example.com'
                })()
            
            # Prepare case details
            case_details = f"""
Person Detected: {log.person_name or 'Unknown'}
Confidence Score: {log.confidence_score or 'N/A'}
Match Type: {log.match_type or 'Unknown'}
Detected At: {log.detected_at}
Notes: {log.notes or 'No additional notes'}
Camera Location: {camera_location}
Camera ID: {log.camera_id or 'N/A'}
            """.strip()
            
            # Send email
            email_sent = email_service.send_alert_email(
                recipient_email=nearest_station.email,
                police_station_name=nearest_station.name,
                camera_location=camera_location,
                latitude=camera_lat,
                longitude=camera_lon,
                case_details=case_details,
                camera_id=log.camera_id or 0
            )
            
            # Create alert log entry
            alert_log = AlertLog(
                police_station_id=nearest_station.id,
                police_station_name=nearest_station.name,
                email=nearest_station.email,
                camera_id=log.camera_id,
                latitude=camera_lat,
                longitude=camera_lon,
                case_details=case_details,
                status="sent" if email_sent else "failed"
            )
            
            db.add(alert_log)
            db.commit()
            
            if email_sent:
                logger.info(f"✅ Alert sent successfully for log ID {log_id}")
            else:
                logger.error(f"❌ Failed to send alert for log ID {log_id}")
            
            return email_sent
            
        except Exception as e:
            logger.error(f"Error sending alert for log ID {log_id}: {str(e)}")
            db.rollback()
            return False

# Global instance
alert_service = AlertService()