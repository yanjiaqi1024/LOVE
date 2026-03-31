from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from ..auth import create_access_token, hash_password, verify_password
from ..db import get_session
from ..models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class AuthBody(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)


@router.post("/register")
def register(body: AuthBody, session: Session = Depends(get_session)):
    username = body.username.strip()
    password = body.password

    existing_any = session.exec(select(User)).first()
    if existing_any is not None:
        if existing_any.username == username:
            existing_any.password_hash = hash_password(password)
            session.add(existing_any)
            session.commit()
            session.refresh(existing_any)
            return {"id": existing_any.id, "username": existing_any.username, "reset": True}
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Single-account mode: user already exists ({existing_any.username})",
        )

    user = User(username=username, password_hash=hash_password(password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"id": user.id, "username": user.username, "reset": False}


@router.post("/login")
def login(body: AuthBody, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == body.username.strip())).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_access_token(subject=user.username)
    return {"access_token": token, "token_type": "bearer"}
