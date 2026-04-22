from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    print("Login attempt:", form_data.username)
    
    # Treat username as email
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user:
        print(f"❌ User not found: {form_data.username}")
        raise HTTPException(status_code=400, detail="Invalid email")

    if not security.verify_password(form_data.password, user.hashed_password):
        print(f"❌ Invalid password for: {form_data.username}")
        raise HTTPException(status_code=400, detail="Invalid password")

    if not user.is_active:
        print(f"❌ Inactive user: {form_data.username}")
        raise HTTPException(status_code=400, detail="Inactive user")

    print(f"✅ Login successful: {form_data.username}, role: {user.role}")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, role=user.role.value, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=UserRead)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this user email already exists in the system.",
        )
    user_obj = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    return user_obj

@router.get("/me", response_model=UserRead)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
