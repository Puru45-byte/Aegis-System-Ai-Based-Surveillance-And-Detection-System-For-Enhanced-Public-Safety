from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_admin
from app.models.tip import Tip
from app.schemas.tip import TipCreate, TipRead

router = APIRouter()

@router.get("/", response_model=List[TipRead])
def get_tips(db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    return db.query(Tip).order_by(Tip.created_at.desc()).all()

@router.post("/", response_model=TipRead)
def submit_tip(tip_in: TipCreate, db: Session = Depends(get_db)):
    tip = Tip(**tip_in.model_dump())
    db.add(tip)
    db.commit()
    db.refresh(tip)
    return tip

@router.patch("/{tip_id}/review", response_model=TipRead)
def mark_tip_reviewed(tip_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_active_admin)):
    tip = db.query(Tip).filter(Tip.id == tip_id).first()
    if not tip:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Tip not found")
    tip.status = "reviewed"
    db.commit()
    db.refresh(tip)
    return tip
