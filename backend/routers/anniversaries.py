from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from ..auth import get_current_user
from ..db import get_session
from ..models import Anniversary, User

router = APIRouter(prefix="/api/anniversaries", tags=["anniversaries"])


class AnniversaryCreate(BaseModel):
    name: str
    day: date


class AnniversaryUpdate(BaseModel):
    name: Optional[str] = None
    day: Optional[date] = None


def _to_dict(a: Anniversary):
    return {"id": a.id, "name": a.name, "day": a.day}


@router.get("")
def list_anniversaries(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    rows = session.exec(select(Anniversary).where(Anniversary.couple_id == user.couple_id).order_by(Anniversary.day)).all()
    return [_to_dict(r) for r in rows]


@router.post("")
def create_anniversary(
    body: AnniversaryCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    item = Anniversary(couple_id=user.couple_id, name=body.name, day=body.day, created_at=datetime.utcnow(), updated_at=datetime.utcnow())
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_dict(item)


@router.put("/{anniversary_id}")
def update_anniversary(
    anniversary_id: int,
    body: AnniversaryUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    item = session.exec(select(Anniversary).where(Anniversary.id == anniversary_id).where(Anniversary.couple_id == user.couple_id)).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if body.name is not None:
        item.name = body.name
    if body.day is not None:
        item.day = body.day
    item.updated_at = datetime.utcnow()
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_dict(item)


@router.delete("/{anniversary_id}")
def delete_anniversary(
    anniversary_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    item = session.exec(select(Anniversary).where(Anniversary.id == anniversary_id).where(Anniversary.couple_id == user.couple_id)).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    session.delete(item)
    session.commit()
    return {"ok": True}
