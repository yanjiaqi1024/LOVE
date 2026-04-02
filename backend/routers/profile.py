from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from ..auth import get_current_user
from ..db import get_session
from ..models import Profile, User

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileDTO(BaseModel):
    spaceName: str = ""
    spaceLogo: str = ""
    yourGender: str = ""
    partnerGender: str = ""
    yourNickname: str = ""
    partnerNickname: str = ""
    yourAvatar: str = ""
    partnerAvatar: str = ""
    metDate: Optional[date] = None
    loveDate: Optional[date] = None
    slogan: str = ""


def _to_dto(p: Profile) -> ProfileDTO:
    return ProfileDTO(
        spaceName=p.space_name,
        spaceLogo=p.space_logo,
        yourGender=p.your_gender,
        partnerGender=p.partner_gender,
        yourNickname=p.your_nickname,
        partnerNickname=p.partner_nickname,
        yourAvatar=p.your_avatar,
        partnerAvatar=p.partner_avatar,
        metDate=p.met_date,
        loveDate=p.love_date,
        slogan=p.slogan,
    )


def _is_slot1_user(session: Session, user: User) -> bool:
    if user.couple_id is None:
        return True
    ids = session.exec(select(User.id).where(User.couple_id == user.couple_id).order_by(User.id.asc())).all()
    if not ids:
        return True
    return int(user.id) == int(ids[0])


def _to_dto_for(session: Session, user: User, p: Profile) -> ProfileDTO:
    is_slot1 = _is_slot1_user(session, user)
    return ProfileDTO(
        spaceName=p.space_name,
        spaceLogo=p.space_logo,
        yourGender=p.your_gender if is_slot1 else p.partner_gender,
        partnerGender=p.partner_gender if is_slot1 else p.your_gender,
        yourNickname=p.your_nickname if is_slot1 else p.partner_nickname,
        partnerNickname=p.partner_nickname if is_slot1 else p.your_nickname,
        yourAvatar=p.your_avatar if is_slot1 else p.partner_avatar,
        partnerAvatar=p.partner_avatar if is_slot1 else p.your_avatar,
        metDate=p.met_date,
        loveDate=p.love_date,
        slogan=p.slogan,
    )


@router.get("")
def get_profile(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    profile = session.exec(select(Profile).where(Profile.couple_id == user.couple_id)).first()
    if profile is None:
        profile = Profile(user_id=user.id, couple_id=user.couple_id)
        session.add(profile)
        try:
            session.commit()
            session.refresh(profile)
        except IntegrityError:
            session.rollback()
            profile = session.exec(select(Profile).where(Profile.couple_id == user.couple_id)).first()
            if profile is None:
                raise
    return _to_dto_for(session, user, profile)


@router.put("")
def put_profile(
    body: ProfileDTO,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    profile = session.exec(select(Profile).where(Profile.couple_id == user.couple_id)).first()
    if profile is None:
        profile = Profile(user_id=user.id, couple_id=user.couple_id)
        session.add(profile)
        try:
            session.commit()
            session.refresh(profile)
        except IntegrityError:
            session.rollback()
            profile = session.exec(select(Profile).where(Profile.couple_id == user.couple_id)).first()
            if profile is None:
                raise

    is_slot1 = _is_slot1_user(session, user)
    profile.your_nickname = body.yourNickname if is_slot1 else body.partnerNickname
    profile.partner_nickname = body.partnerNickname if is_slot1 else body.yourNickname
    profile.your_avatar = body.yourAvatar if is_slot1 else body.partnerAvatar
    profile.partner_avatar = body.partnerAvatar if is_slot1 else body.yourAvatar
    profile.space_name = body.spaceName
    profile.space_logo = body.spaceLogo
    profile.your_gender = body.yourGender if is_slot1 else body.partnerGender
    profile.partner_gender = body.partnerGender if is_slot1 else body.yourGender
    profile.met_date = body.metDate
    profile.love_date = body.loveDate
    profile.slogan = body.slogan
    profile.updated_at = datetime.utcnow()
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return _to_dto_for(session, user, profile)
