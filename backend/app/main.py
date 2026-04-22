import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.websockets.live_detection import websocket_endpoint
from app.api.deps import get_current_user
# Import all models to ensure they're registered with Base
from app.models.user import User
from app.models.suspect import Case
from app.models.detection_log import SurveillanceLog
from app.models.tip import Tip
from app.models.missing_person import MissingPerson
from app.models.police_station import PoliceStation

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # Make sure all tables are created. 
    # (In production, use Alembic migrations instead)
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    # Clean up resources if needed
    await asyncio.sleep(0.1)  # Allow pending tasks to complete

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

# WebSocket endpoint for live detection control
@app.websocket("/ws/live-detection")
async def live_detection_websocket(websocket: WebSocket, token: str = Query(...)):
    await websocket_endpoint(websocket, token)

@app.get("/")
def root():
    return {"message": "Welcome to Aegis System API"}
