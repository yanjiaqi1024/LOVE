from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
MEDIA_DIR = Path(os.environ.get("COUPLESPACE_MEDIA_DIR") or (BASE_DIR / "data" / "media")).resolve()
AVATAR_DIR = (MEDIA_DIR / "avatars").resolve()
POST_MEDIA_DIR = (MEDIA_DIR / "posts").resolve()


def ensure_dirs() -> None:
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    POST_MEDIA_DIR.mkdir(parents=True, exist_ok=True)
