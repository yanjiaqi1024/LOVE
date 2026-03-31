from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from ..auth import get_current_user
from ..models import User
from ..settings import AVATAR_DIR, ensure_dirs

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

MAX_AVATAR_BYTES = int(os.environ.get("COUPLESPACE_MAX_AVATAR_BYTES") or (5 * 1024 * 1024))

MIME_EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


def _public_url(request: Request, path: str) -> str:
    base = str(request.base_url).rstrip("/")
    if not path.startswith("/"):
        path = "/" + path
    return f"{base}{path}"


@router.post("/avatar")
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    ensure_dirs()
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="仅支持图片文件")

    ext = MIME_EXT.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="不支持的图片格式")

    name = f"{user.id}_{uuid.uuid4().hex}.{ext}"
    target: Path = (AVATAR_DIR / name).resolve()
    if AVATAR_DIR not in target.parents:
        raise HTTPException(status_code=400, detail="非法文件路径")

    written = 0
    try:
        with target.open("wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                written += len(chunk)
                if written > MAX_AVATAR_BYTES:
                    raise HTTPException(status_code=413, detail="图片太大")
                f.write(chunk)
    finally:
        try:
            await file.close()
        except Exception:
            pass

    rel_path = f"/media/avatars/{name}"
    return {
        "path": rel_path,
        "url": _public_url(request, rel_path),
        "contentType": file.content_type,
        "size": written,
    }

