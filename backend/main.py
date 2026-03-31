from __future__ import annotations

from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .auth import get_current_user
from .db import init_db
from .routers import album_meta, anniversaries, auth, checkin, profile
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
def me(user=Depends(get_current_user)):
    return {"id": user.id, "username": user.username}


app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(checkin.router)
app.include_router(anniversaries.router)
app.include_router(album_meta.router)
app.include_router(uploads.router)

FRONTEND_DIR = (Path(__file__).resolve().parent.parent / "frontend").as_posix()


@app.get("/")
def index():
    return FileResponse(f"{FRONTEND_DIR}/index.html")

ensure_dirs()
app.mount("/media", StaticFiles(directory=MEDIA_DIR.as_posix(), html=False), name="media")

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
