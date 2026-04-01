from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from ..auth import create_access_token, hash_password, verify_password
from ..db import get_session
from ..invites import generate_invite_code
from ..models import Couple, User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class AuthBody(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)
    invite_code: Optional[str] = Field(default=None, max_length=128)


def _ensure_user_defaults(session: Session, user: User, *, ensure_couple: bool = True) -> None:
    changed = False
    if ensure_couple and user.couple_id is None:
        couple = Couple()
        session.add(couple)
        session.commit()
        session.refresh(couple)
        user.couple_id = couple.id
        changed = True
    if not user.invite_code:
        code = generate_invite_code()
        while session.exec(select(User).where(User.invite_code == code)).first() is not None:
            code = generate_invite_code()
        user.invite_code = code
        changed = True
    if changed:
        session.add(user)
        session.commit()
        session.refresh(user)


def _apply_invite(session: Session, user: User, invite_code: str) -> None:
    code = (invite_code or "").strip()
    if not code:
        return

    inviter = session.exec(select(User).where(User.invite_code == code)).first()
    if inviter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请码不存在或已失效")
    if inviter.id == user.id:
        return

    _ensure_user_defaults(session, inviter)

    couple_id = inviter.couple_id
    if couple_id is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="邀请码异常")

    members = session.exec(select(User).where(User.couple_id == couple_id)).all()
    if len(members) >= 2 and all(m.id != user.id for m in members):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="该情侣空间已满员")

    if user.couple_id is not None and user.couple_id != couple_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="该账号已绑定其他情侣空间")

    user.couple_id = couple_id
    session.add(user)
    session.commit()
    session.refresh(user)


@router.post("/register")
def register(body: AuthBody, session: Session = Depends(get_session)):
    username = body.username.strip()
    password = body.password

    existing = session.exec(select(User).where(User.username == username)).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")

    user = User(username=username, password_hash=hash_password(password))
    session.add(user)
    session.commit()
    session.refresh(user)
    if body.invite_code:
        _apply_invite(session, user, body.invite_code)
    _ensure_user_defaults(session, user, ensure_couple=(user.couple_id is None))
    return {"id": user.id, "username": user.username}


@router.post("/login")
def login(body: AuthBody, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == body.username.strip())).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    if body.invite_code:
        _apply_invite(session, user, body.invite_code)
    _ensure_user_defaults(session, user, ensure_couple=(user.couple_id is None))

    token = create_access_token(subject=user.username)
    return {"access_token": token, "token_type": "bearer"}
