from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TipCreate(BaseModel):
    # Accept frontend fields but map to database title
    tip_type: Optional[str] = Field(None, description="Type of tip")
    description: str = Field(..., description="Detailed description of the tip")  # REQUIRED (FIXED)
    subject_name: Optional[str] = Field(None, description="Name of person involved")
    location: Optional[str] = Field(None, description="Location where incident occurred")
    contact_name: Optional[str] = Field(None, description="Name of tip submitter")
    contact_phone: Optional[str] = Field(None, description="Phone number of tip submitter")
    contact_email: Optional[str] = Field(None, description="Email of tip submitter")
    is_anonymous: Optional[bool] = Field(False, description="Whether tip was submitted anonymously")
    suspect_id: Optional[int] = Field(None, description="ID of suspect from database if applicable")
    
    # Create title from available fields
    def get_title(self):
        """Generate title from available fields"""
        if self.subject_name:
            return f"Tip about {self.subject_name}"
        elif self.description:
            return self.description[:100] + ("..." if len(self.description) > 100 else "")
        else:
            return "Anonymous Tip"

class TipUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Title of the tip")
    content: Optional[str] = Field(None, description="Content of the tip")

class TipRead(BaseModel):
    id: int
    title: str
    content: str
    # Add frontend-compatible fields (extracted from content)
    tip_type: Optional[str] = None
    description: Optional[str] = None
    subject_name: Optional[str] = None
    location: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    is_anonymous: Optional[bool] = False
    status: Optional[str] = "pending"
    created_at: Optional[datetime] = None

    @classmethod
    def from_tip_model(cls, tip):
        """Create TipRead from Tip model, parsing content for frontend fields"""
        # Parse content to extract individual fields
        content_lines = tip.content.split('\n') if tip.content else []
        
        # Initialize default values
        tip_data = {
            'id': tip.id,
            'title': tip.title,
            'content': tip.content,
            'tip_type': 'other',
            'description': '',
            'subject_name': None,
            'location': None,
            'contact_name': None,
            'contact_phone': None,
            'contact_email': None,
            'is_anonymous': False,
            'status': getattr(tip, 'status', 'pending'),  # Read from database, fallback to 'pending'
            'created_at': None  # Set to None since created_at doesn't exist in database
        }
        
        # Parse content lines
        for line in content_lines:
            if line.startswith('Description:'):
                tip_data['description'] = line.replace('Description:', '').strip()
            elif line.startswith('Subject:'):
                tip_data['subject_name'] = line.replace('Subject:', '').strip()
            elif line.startswith('Location:'):
                tip_data['location'] = line.replace('Location:', '').strip()
            elif line.startswith('Type:'):
                tip_data['tip_type'] = line.replace('Type:', '').strip()
            elif line.startswith('Case ID:'):
                tip_data['suspect_id'] = line.replace('Case ID:', '').strip()
        
        return cls(**tip_data)

    class Config:
        from_attributes = True
