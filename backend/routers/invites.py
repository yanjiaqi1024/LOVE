from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..auth import get_current_user
from ..db import get_session
from ..invites import generate_invite_code
from ..models import User

router = APIRouter(prefix="/api/invites", tags=["invites"])


@router.get("/me")
def get_my_invite(user=Depends(get_current_user), session: Session = Depends(get_session)):
    if not user.invite_code:
        code = generate_invite_code()
        from sqlmodel import select

        while session.exec(select(User).where(User.invite_code == code)).first() is not None:
            code = generate_invite_code()
        user.invite_code = code
        session.add(user)
        session.commit()
        session.refresh(user)
    return {"inviteCode": user.invite_code}

