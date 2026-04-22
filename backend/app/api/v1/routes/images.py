"""
Static image routes for fallback and default images
"""

import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

# Default image path (you can replace this with an actual default image)
DEFAULT_IMAGE_PATH = "backend/uploads/default-profile.png"

@router.get("/default-profile")
def get_default_profile_image():
    """Get default profile image for fallback"""
    
    # Try to find a default image or create a simple one
    default_paths = [
        "backend/uploads/default-profile.png",
        "backend/uploads/default-profile.jpg",
        "backend/uploads/default-avatar.png",
        "backend/uploads/default-avatar.jpg",
        "uploads/default-profile.png",
        "uploads/default-profile.jpg",
        "uploads/default-avatar.png",
        "uploads/default-avatar.jpg"
    ]
    
    for path in default_paths:
        if os.path.exists(path):
            return FileResponse(path)
    
    # If no default image exists, create a simple 1x1 transparent PNG
    # This is a minimal 1x1 transparent PNG in hex
    transparent_png_hex = (
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154"
        "78da636460f85f0f0002870180eb47ba920000000049454e44ae426082"
    )
    
    # Convert hex to bytes
    import binascii
    png_data = binascii.unhexlify(transparent_png_hex)
    
    # Create a temporary file for the default image
    temp_path = "backend/temp_default.png"
    with open(temp_path, "wb") as f:
        f.write(png_data)
    
    return FileResponse(
        temp_path,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"}  # Cache for 1 day
    )
