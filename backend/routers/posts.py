from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from ..auth import get_current_user
from ..db import get_session
from ..models import Post, PostMedia, User
from ..settings import POST_MEDIA_DIR

router = APIRouter(prefix="/api/posts", tags=["posts"])


class PostMediaIn(BaseModel):
    url: str = Field(min_length=1, max_length=1024)
    kind: str = Field(default="image", max_length=16)
    contentType: str = Field(default="", max_length=128)


class PostCreate(BaseModel):
    author: str = Field(default="your", max_length=16)
    content: str = Field(default="", max_length=4000)
    location: str = Field(default="", max_length=128)
    media: List[PostMediaIn] = Field(default_factory=list)


def _safe_delete_post_file(url: str) -> None:
    try:
        path = urlparse(url).path if "://" in url else url
        if not isinstance(path, str) or not path.startswith("/media/posts/"):
            return
        name = path.split("/media/posts/", 1)[1].strip().lstrip("/")
        if not name:
            return
        target = (POST_MEDIA_DIR / name).resolve()
        if POST_MEDIA_DIR not in target.parents:
            return
        if target.exists() and target.is_file():
            target.unlink()
    except Exception:
        return


def _to_dict(post: Post, media: list[PostMedia], *, viewer_user_id: int) -> dict:
    return {
        "id": post.id,
        "author": post.author,
        "content": post.content,
        "location": post.location,
        "createdAt": post.created_at,
        "updatedAt": post.updated_at,
        "media": [{"id": m.id, "url": m.url, "kind": m.kind, "contentType": m.content_type} for m in media],
        "canDelete": bool(post.user_id) and int(post.user_id) == int(viewer_user_id),
    }


@router.get("")
def list_posts(
    limit: int = 30,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    limit = max(1, min(int(limit or 30), 100))
    posts = session.exec(
        select(Post).where(Post.couple_id == user.couple_id).order_by(Post.created_at.desc()).limit(limit)
    ).all()
    out = []
    for p in posts:
        ms = session.exec(select(PostMedia).where(PostMedia.post_id == p.id).order_by(PostMedia.id.asc())).all()
        out.append(_to_dict(p, ms, viewer_user_id=user.id))
    return out


@router.post("")
def create_post(
    body: PostCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    media = body.media or []
    if len(media) > 9:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="最多支持 9 个媒体文件")
    has_video = any((m.kind or "").startswith("video") or (m.contentType or "").startswith("video/") for m in media)
    if has_video and len(media) > 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="视频只能上传 1 个")

    now = datetime.utcnow()
    post = Post(
        user_id=user.id,
        couple_id=user.couple_id,
        author=(body.author or "your").strip() or "your",
        content=(body.content or "").strip(),
        location=(body.location or "").strip(),
        created_at=now,
        updated_at=now,
    )
    session.add(post)
    session.commit()
    session.refresh(post)

    items: list[PostMedia] = []
    for m in media:
        kind = (m.kind or "").strip() or ("video" if (m.contentType or "").startswith("video/") else "image")
        item = PostMedia(
            user_id=user.id,
            couple_id=user.couple_id,
            post_id=post.id,
            url=m.url,
            kind=kind,
            content_type=m.contentType or "",
            created_at=now,
        )
        session.add(item)
        items.append(item)
    session.commit()
    for it in items:
        session.refresh(it)
    return _to_dict(post, items, viewer_user_id=user.id)


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    post = session.exec(select(Post).where(Post.id == post_id).where(Post.couple_id == user.couple_id)).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if not post.user_id or int(post.user_id) != int(user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    media = session.exec(select(PostMedia).where(PostMedia.post_id == post.id)).all()
    for m in media:
        _safe_delete_post_file(m.url)
        session.delete(m)

    session.delete(post)
    session.commit()
    return {"ok": True}
