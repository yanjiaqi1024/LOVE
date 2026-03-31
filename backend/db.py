from __future__ import annotations

import os

from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.environ.get("COUPLESPACE_DATABASE_URL")
DB_PATH = os.environ.get("COUPLESPACE_DB_PATH", os.path.join(os.path.dirname(__file__), "app.db"))
DB_URL = DATABASE_URL or f"sqlite:///{DB_PATH}"

if DB_URL.startswith("sqlite:///"):
    engine = create_engine(DB_URL, connect_args={"check_same_thread": False}, pool_pre_ping=True)
else:
    engine = create_engine(DB_URL, pool_pre_ping=True)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
