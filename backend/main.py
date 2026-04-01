from __future__ import annotations

from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from .auth import get_current_user
from .db import get_session, init_db
from .models import User
from .routers import album_meta, anniversaries, auth, checkin, invites, profile
from .routers import posts
from .routers import uploads
from .settings import MEDIA_DIR, ensure_dirs

app = FastAPI(title="Couple Space API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/me")
def me(user=Depends(get_current_user), session: Session = Depends(get_session)):
    couple_id = user.couple_id
    member_count = 0
    if couple_id is not None:
        rows = session.exec(select(User.id).where(User.couple_id == couple_id)).all()
        member_count = len(rows)
    return {"id": user.id, "username": user.username, "coupleId": couple_id, "coupleMemberCount": member_count}


app.include_router(auth.router)
app.include_router(invites.router)
app.include_router(profile.router)
app.include_router(checkin.router)
app.include_router(anniversaries.router)
app.include_router(album_meta.router)
app.include_router(posts.router)
app.include_router(uploads.router)

FRONTEND_DIR = (Path(__file__).resolve().parent.parent / "frontend").as_posix()


@app.get("/")
def index():
    return FileResponse(f"{FRONTEND_DIR}/index.html")

ensure_dirs()
app.mount("/media", StaticFiles(directory=MEDIA_DIR.as_posix(), html=False), name="media")

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
