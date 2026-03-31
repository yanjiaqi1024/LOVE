from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from ..auth import get_current_user
from ..db import get_session
from ..models import AlbumMeta, User

router = APIRouter(prefix="/api/album-meta", tags=["album-meta"])


class AlbumMetaCreate(BaseModel):
    localId: str
    title: str = ""
    takenAt: Optional[datetime] = None


class AlbumMetaUpdate(BaseModel):
    title: Optional[str] = None
    takenAt: Optional[datetime] = None


def _to_dict(m: AlbumMeta):
    return {"id": m.id, "localId": m.local_id, "title": m.title, "takenAt": m.taken_at}


@router.get("")
def list_meta(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    rows = session.exec(select(AlbumMeta).where(AlbumMeta.user_id == user.id).order_by(AlbumMeta.created_at.desc())).all()
    return [_to_dict(r) for r in rows]


@router.post("")
def create_meta(
    body: AlbumMetaCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    existing = session.exec(select(AlbumMeta).where(AlbumMeta.user_id == user.id).where(AlbumMeta.local_id == body.localId)).first()
    if existing is not None:
        return _to_dict(existing)

    item = AlbumMeta(
        user_id=user.id,
        local_id=body.localId,
        title=body.title,
        taken_at=body.takenAt,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_dict(item)


@router.put("/{meta_id}")
def update_meta(
    meta_id: int,
    body: AlbumMetaUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    item = session.exec(select(AlbumMeta).where(AlbumMeta.id == meta_id).where(AlbumMeta.user_id == user.id)).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if body.title is not None:
        item.title = body.title
    if body.takenAt is not None:
        item.taken_at = body.takenAt
    item.updated_at = datetime.utcnow()
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_dict(item)


@router.delete("/{meta_id}")
def delete_meta(
    meta_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    item = session.exec(select(AlbumMeta).where(AlbumMeta.id == meta_id).where(AlbumMeta.user_id == user.id)).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    session.delete(item)
    session.commit()
    return {"ok": True}
