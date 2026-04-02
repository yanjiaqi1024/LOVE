from __future__ import annotations

import os

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.environ.get("COUPLESPACE_DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "COUPLESPACE_DATABASE_URL 未设置：已禁用 SQLite 回退。请配置 MySQL 连接串，例如 "
        "mysql+pymysql://user:password@127.0.0.1:3306/db?charset=utf8mb4"
    )
DB_URL = DATABASE_URL

engine = create_engine(DB_URL, pool_pre_ping=True)


def _q(name: str) -> str:
    if engine.dialect.name == "mysql":
        return f"`{name}`"
    return f'"{name}"'


def _ensure_columns() -> None:
    insp = inspect(engine)
    table_cols = {t: {c["name"] for c in insp.get_columns(t)} for t in insp.get_table_names()}

    alters: list[tuple[str, str, str]] = []

    if "user" in table_cols:
        if "couple_id" not in table_cols["user"]:
            alters.append(("user", "couple_id", "INTEGER"))
        if "invite_code" not in table_cols["user"]:
            alters.append(("user", "invite_code", "VARCHAR(64)"))

    targets = ["profile", "anniversary", "albummeta", "post", "postmedia"]
    for t in targets:
        if t not in table_cols:
            continue
        if "couple_id" not in table_cols[t]:
            alters.append((t, "couple_id", "INTEGER"))
        if t == "profile" and "user_id" not in table_cols[t]:
            alters.append((t, "user_id", "INTEGER"))
        if t == "profile" and "space_name" not in table_cols[t]:
            alters.append((t, "space_name", "VARCHAR(64)"))
        if t == "profile" and "space_logo" not in table_cols[t]:
            alters.append((t, "space_logo", "VARCHAR(1024)"))
        if t == "profile" and "your_gender" not in table_cols[t]:
            alters.append((t, "your_gender", "VARCHAR(16)"))
        if t == "profile" and "partner_gender" not in table_cols[t]:
            alters.append((t, "partner_gender", "VARCHAR(16)"))
        if t in ("post", "postmedia") and "user_id" not in table_cols[t]:
            alters.append((t, "user_id", "INTEGER"))

    if not alters:
        return

    with engine.begin() as conn:
        for (t, col, typ) in alters:
            conn.execute(text(f"ALTER TABLE {_q(t)} ADD COLUMN {col} {typ}"))


def _backfill_couple_data() -> None:
    from .invites import generate_invite_code
    from .models import Couple, User
    from sqlmodel import select

    with Session(engine) as session:
        users = session.exec(text(f"SELECT id, couple_id, invite_code FROM {_q('user')}")).all()
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
            "anniversary",
            "albummeta",
            "post",
            "postmedia",
        ]
        insp = inspect(engine)
        table_cols = {t: {c["name"] for c in insp.get_columns(t)} for t in insp.get_table_names()}
        for t in updates:
            col_names = table_cols.get(t) or set()
            if "user_id" not in col_names or "couple_id" not in col_names:
                continue
            session.exec(
                text(
                    f"UPDATE {_q(t)} SET couple_id = (SELECT couple_id FROM {_q('user')} u WHERE u.id = {_q(t)}.user_id) "
                    f"WHERE couple_id IS NULL"
                )
            )
            session.commit()


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _ensure_columns()
    _backfill_couple_data()


def get_session():
    with Session(engine) as session:
        yield session
