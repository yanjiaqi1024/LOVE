from __future__ import annotations

import os

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.environ.get("COUPLESPACE_DATABASE_URL")
DB_PATH = os.environ.get("COUPLESPACE_DB_PATH", os.path.join(os.path.dirname(__file__), "app.db"))
DB_URL = DATABASE_URL or f"sqlite:///{DB_PATH}"

if DB_URL.startswith("sqlite:///"):
    engine = create_engine(DB_URL, connect_args={"check_same_thread": False}, pool_pre_ping=True)
else:
    engine = create_engine(DB_URL, pool_pre_ping=True)


def _ensure_sqlite_columns() -> None:
    if not DB_URL.startswith("sqlite:///"):
        return

    insp = inspect(engine)
    table_cols = {t: {c["name"] for c in insp.get_columns(t)} for t in insp.get_table_names()}

    alters: list[tuple[str, str, str]] = []

    if "user" in table_cols:
        if "couple_id" not in table_cols["user"]:
            alters.append(("user", "couple_id", "INTEGER"))
        if "invite_code" not in table_cols["user"]:
            alters.append(("user", "invite_code", "VARCHAR(64)"))

    targets = ["profile", "checkin", "anniversary", "albummeta", "post", "postmedia"]
    for t in targets:
        if t not in table_cols:
            continue
        if "couple_id" not in table_cols[t]:
            alters.append((t, "couple_id", "INTEGER"))
        if t in ("post", "postmedia") and "user_id" not in table_cols[t]:
            alters.append((t, "user_id", "INTEGER"))

    if not alters:
        return

    with engine.begin() as conn:
        for (t, col, typ) in alters:
            conn.execute(text(f'ALTER TABLE "{t}" ADD COLUMN {col} {typ}'))


def _backfill_couple_data() -> None:
    if not DB_URL.startswith("sqlite:///"):
        return

    from .invites import generate_invite_code
    from .models import Couple, User
    from sqlmodel import select

    with Session(engine) as session:
        users = session.exec(text('SELECT id, couple_id, invite_code FROM "user"')).all()
        for (uid, couple_id, invite_code) in users:
            need_couple = couple_id is None
            need_code = not invite_code
            if not need_couple and not need_code:
                continue

            user = session.get(User, uid)
            if user is None:
                continue
            changed = False
            if user.couple_id is None:
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

        updates = [
            "profile",
            "checkin",
            "anniversary",
            "albummeta",
            "post",
            "postmedia",
        ]
        for t in updates:
            cols = session.exec(text(f'PRAGMA table_info("{t}")')).all()
            col_names = {c[1] for c in cols}
            if "user_id" not in col_names or "couple_id" not in col_names:
                continue
            session.exec(
                text(
                    f'UPDATE "{t}" SET couple_id = (SELECT couple_id FROM "user" u WHERE u.id = "{t}".user_id) '
                    f'WHERE couple_id IS NULL'
                )
            )
            session.commit()


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _ensure_sqlite_columns()
    _backfill_couple_data()


def get_session():
    with Session(engine) as session:
        yield session
