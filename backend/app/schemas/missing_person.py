from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class MissingPersonCreate(BaseModel):
    missing_person_name: str = Field(..., description="Full name of missing person")
    age: Optional[str] = Field(None, description="Age or age range")
    gender: Optional[str] = Field(None, description="Gender: male, female, other")
    height: Optional[str] = Field(None, description="Height")
    weight: Optional[str] = Field(None, description="Weight")
    hair_color: Optional[str] = Field(None, description="Hair color")
    eye_color: Optional[str] = Field(None, description="Eye color")
    clothing_description: Optional[str] = Field(None, description="Description of clothing")
    medical_conditions: Optional[str] = Field(None, description="Medical conditions or special needs")
    last_seen_location: str = Field(..., description="Where person was last seen")
    last_seen_date: datetime = Field(..., description="Date when person was last seen")
    last_seen_time: Optional[str] = Field(None, description="Time when person was last seen")
    circumstances: Optional[str] = Field(None, description="Circumstances of disappearance")
    contact_name: Optional[str] = Field(None, description="Name of person submitting report")
    contact_phone: str = Field(..., description="Phone number for follow-up")
    contact_email: Optional[str] = Field(None, description="Email address")
    relationship_to_missing: Optional[str] = Field(None, description="Relationship to missing person")
    is_anonymous: bool = Field(False, description="Whether report is anonymous")
    status: str = Field("active", description="Status: active, found, resolved")

class MissingPersonUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Status: active, found, resolved")

class MissingPersonRead(BaseModel):
    id: int
    missing_person_name: str
    age: Optional[str]
    gender: Optional[str]
    height: Optional[str]
    weight: Optional[str]
    hair_color: Optional[str]
    eye_color: Optional[str]
    clothing_description: Optional[str]
    medical_conditions: Optional[str]
    last_seen_location: str
    last_seen_date: Optional[datetime]
    last_seen_time: Optional[str]
    circumstances: Optional[str]
    photo_path: Optional[str]
    contact_name: Optional[str]
    contact_phone: str
    contact_email: Optional[str]
    relationship_to_missing: Optional[str]
    is_anonymous: bool
    status: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
