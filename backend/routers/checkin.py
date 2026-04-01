from __future__ import annotations

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..auth import get_current_user
from ..db import get_session
from ..models import Checkin, User

router = APIRouter(prefix="/api/checkins", tags=["checkins"])


def _summary(session: Session, user_id: int):
    rows = session.exec(select(Checkin.day).where(Checkin.user_id == user_id)).all()
    days = set(rows)
    today = date.today()
    checked_in_today = today in days
    total = len(days)

    streak = 0
    cursor = today if checked_in_today else today - timedelta(days=1)
    while cursor in days:
        streak += 1
        cursor = cursor - timedelta(days=1)

    last_day = max(days) if days else None
    return {
        "checkedInToday": checked_in_today,
        "streakDays": streak,
        "totalDays": total,
        "lastCheckinDate": last_day,
    }


@router.get("/summary")
def get_summary(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return _summary(session, user.id)


@router.get("/pair")
def get_pair_summary(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    partner = None
    if user.couple_id is not None:
        partner = session.exec(
            select(User).where(User.couple_id == user.couple_id).where(User.id != user.id).order_by(User.id.asc())
        ).first()
    return {
        "your": _summary(session, user.id),
        "partner": _summary(session, partner.id) if partner is not None else None,
    }


@router.post("/today")
def checkin_today(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    today = date.today()
    existing = session.exec(
        select(Checkin).where(Checkin.user_id == user.id).where(Checkin.day == today)
    ).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already checked in today")

    session.add(Checkin(user_id=user.id, day=today, created_at=datetime.utcnow()))
    session.commit()
    return _summary(session, user.id)
