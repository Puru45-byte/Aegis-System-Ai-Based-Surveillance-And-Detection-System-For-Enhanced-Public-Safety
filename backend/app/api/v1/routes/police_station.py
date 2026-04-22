from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import math

from app.api import deps
from app.models.police_station import PoliceStation
from app.schemas.police_station import PoliceStationCreate, PoliceStationUpdate, PoliceStationResponse, PoliceStationNearby

router = APIRouter()

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on earth (specified in decimal degrees)
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

@router.post("/police-stations", response_model=dict)
def create_police_station(
    police_station: PoliceStationCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Create a new police station
    """
    # Validation
    if not police_station.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not police_station.address.strip():
        raise HTTPException(status_code=400, detail="Address is required")
    if not police_station.city.strip():
        raise HTTPException(status_code=400, detail="City is required")
    if not police_station.state.strip():
        raise HTTPException(status_code=400, detail="State is required")
    
    db_police_station = PoliceStation(**police_station.dict())
    db.add(db_police_station)
    db.commit()
    db.refresh(db_police_station)
    
    return {
        "success": True,
        "data": {
            "id": db_police_station.id,
            "name": db_police_station.name,
            "address": db_police_station.address,
            "city": db_police_station.city,
            "state": db_police_station.state,
            "contact_number": db_police_station.contact_number,
            "email": db_police_station.email,
            "latitude": db_police_station.latitude,
            "longitude": db_police_station.longitude,
            "created_at": db_police_station.created_at
        }
    }

@router.get("/police-stations", response_model=dict)
def get_all_police_stations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(deps.get_db)
):
    """
    Get all police stations with pagination
    """
    police_stations = db.query(PoliceStation).offset(skip).limit(limit).all()
    total = db.query(PoliceStation).count()
    
    return {
        "success": True,
        "data": {
            "police_stations": [PoliceStationResponse.from_orm(station) for station in police_stations],
            "total": total,
            "skip": skip,
            "limit": limit
        }
    }

@router.get("/police-stations/{station_id}", response_model=dict)
def get_police_station(
    station_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    Get a specific police station by ID
    """
    station = db.query(PoliceStation).filter(PoliceStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Police station not found")
    
    return {
        "success": True,
        "data": PoliceStationResponse.from_orm(station)
    }

@router.put("/police-stations/{station_id}", response_model=dict)
def update_police_station(
    station_id: int,
    station_update: PoliceStationUpdate,
    db: Session = Depends(deps.get_db)
):
    """
    Update a police station
    """
    station = db.query(PoliceStation).filter(PoliceStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Police station not found")
    
    update_data = station_update.dict(exclude_unset=True)
    
    # Validation for required fields if provided
    if "name" in update_data and not update_data["name"].strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    if "address" in update_data and not update_data["address"].strip():
        raise HTTPException(status_code=400, detail="Address cannot be empty")
    if "city" in update_data and not update_data["city"].strip():
        raise HTTPException(status_code=400, detail="City cannot be empty")
    if "state" in update_data and not update_data["state"].strip():
        raise HTTPException(status_code=400, detail="State cannot be empty")
    
    for field, value in update_data.items():
        setattr(station, field, value)
    
    db.commit()
    db.refresh(station)
    
    return {
        "success": True,
        "data": PoliceStationResponse.from_orm(station)
    }

@router.delete("/police-stations/{station_id}", response_model=dict)
def delete_police_station(
    station_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    Delete a police station
    """
    station = db.query(PoliceStation).filter(PoliceStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Police station not found")
    
    db.delete(station)
    db.commit()
    
    return {
        "success": True,
        "message": "Police station deleted successfully"
    }

@router.get("/police-stations/nearby", response_model=dict)
def get_nearby_police_stations(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius_km: float = Query(10.0, ge=0.1, le=100.0, description="Search radius in kilometers"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    db: Session = Depends(deps.get_db)
):
    """
    Get nearby police stations sorted by distance
    """
    # Get all stations with coordinates
    stations = db.query(PoliceStation).filter(
        PoliceStation.latitude.isnot(None),
        PoliceStation.longitude.isnot(None)
    ).all()
    
    nearby_stations = []
    for station in stations:
        distance = calculate_distance(lat, lon, station.latitude, station.longitude)
        if distance <= radius_km:
            station_data = PoliceStationResponse.from_orm(station).dict()
            station_data["distance_km"] = round(distance, 2)
            nearby_stations.append(station_data)
    
    # Sort by distance
    nearby_stations.sort(key=lambda x: x["distance_km"])
    
    # Limit results
    nearby_stations = nearby_stations[:limit]
    
    return {
        "success": True,
        "data": {
            "nearby_stations": nearby_stations,
            "search_center": {"latitude": lat, "longitude": lon},
            "radius_km": radius_km,
            "total_found": len(nearby_stations)
        }
    }
