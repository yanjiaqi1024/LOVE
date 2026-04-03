from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..auth import get_current_user
from ..db import get_session
from ..models import Checkin, User

router = APIRouter(prefix="/api/couples", tags=["couples"])


@router.post("/breakup")
def breakup(user=Depends(get_current_user), session: Session = Depends(get_session)):
    couple_id = user.couple_id
    if couple_id is None:
        return {"ok": True}

    members = session.exec(select(User).where(User.couple_id == couple_id)).all()
    member_ids = [m.id for m in members if m.id is not None]

    if member_ids:
        checkins = session.exec(select(Checkin).where(Checkin.user_id.in_(member_ids))).all()
        for c in checkins:
            session.delete(c)

    for m in members:
        m.couple_id = None
        m.invite_code = None
        session.add(m)

    session.commit()
    return {"ok": True}
