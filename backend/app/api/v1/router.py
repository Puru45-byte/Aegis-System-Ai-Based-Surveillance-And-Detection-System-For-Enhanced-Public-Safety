from fastapi import APIRouter
from app.api.v1.routes import auth, watchlist, alerts, analytics, detection, dashboard, scan, surveillance, tips, missing_persons, images, live_detection, police_station, alert_logs, test_email

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(watchlist.router, prefix="/cases", tags=["cases"])
api_router.include_router(alerts.router, prefix="/surveillance", tags=["surveillance"])
api_router.include_router(detection.router, prefix="/cameras", tags=["cameras"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(scan.router, prefix="/scan", tags=["scan"])
api_router.include_router(surveillance.router, prefix="/surveillance", tags=["surveillance"])
api_router.include_router(tips.router, prefix="/tips", tags=["tips"])
api_router.include_router(missing_persons.router, prefix="/missing-persons", tags=["missing-persons"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(live_detection.router, prefix="/detection", tags=["live-detection"])
api_router.include_router(police_station.router, tags=["police-stations"])
api_router.include_router(alert_logs.router, tags=["alert-logs"])
api_router.include_router(test_email.router, tags=["test-email"])
