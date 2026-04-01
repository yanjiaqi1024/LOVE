from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Profile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id", unique=True)

    your_nickname: str = ""
    partner_nickname: str = ""
    your_avatar: str = ""
    partner_avatar: str = ""

    met_date: Optional[date] = None
    love_date: Optional[date] = None
    slogan: str = ""

    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Checkin(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    day: date = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Anniversary(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    name: str
    day: date
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AlbumMeta(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    local_id: str = Field(index=True)
    title: str = ""
    taken_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    author: str = Field(default="your", max_length=16)
    content: str = Field(default="", max_length=4000)
    location: str = Field(default="", max_length=128)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PostMedia(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    post_id: int = Field(index=True, foreign_key="post.id")
    url: str = Field(max_length=1024)
    kind: str = Field(default="image", max_length=16)
    content_type: str = Field(default="", max_length=128)
    created_at: datetime = Field(default_factory=datetime.utcnow)
