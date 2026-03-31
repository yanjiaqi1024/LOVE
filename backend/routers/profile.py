from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..auth import get_current_user
from ..db import get_session
from ..models import Profile, User

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileDTO(BaseModel):
    yourNickname: str = ""
    partnerNickname: str = ""
    yourAvatar: str = ""
    partnerAvatar: str = ""
    metDate: Optional[date] = None
    loveDate: Optional[date] = None
    slogan: str = ""


def _to_dto(p: Profile) -> ProfileDTO:
    return ProfileDTO(
        yourNickname=p.your_nickname,
        partnerNickname=p.partner_nickname,
        yourAvatar=p.your_avatar,
        partnerAvatar=p.partner_avatar,
        metDate=p.met_date,
        loveDate=p.love_date,
        slogan=p.slogan,
    )


@router.get("")
def get_profile(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    profile = session.exec(select(Profile).where(Profile.user_id == user.id)).first()
    if profile is None:
        profile = Profile(user_id=user.id)
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return _to_dto(profile)


@router.put("")
def put_profile(
    body: ProfileDTO,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    profile = session.exec(select(Profile).where(Profile.user_id == user.id)).first()
    if profile is None:
        profile = Profile(user_id=user.id)
        session.add(profile)
        session.commit()
        session.refresh(profile)

    profile.your_nickname = body.yourNickname
    profile.partner_nickname = body.partnerNickname
    profile.your_avatar = body.yourAvatar
    profile.partner_avatar = body.partnerAvatar
    profile.met_date = body.metDate
    profile.love_date = body.loveDate
    profile.slogan = body.slogan
    profile.updated_at = datetime.utcnow()
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return _to_dto(profile)
