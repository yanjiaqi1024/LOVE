from __future__ import annotations

import argparse

from sqlmodel import SQLModel, Session, create_engine, select

from backend.models import AlbumMeta, Anniversary, Checkin, Profile, User


def _dump_model(obj):
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    return obj.dict()


def _sqlite_engine(url: str):
    return create_engine(url, connect_args={"check_same_thread": False}, pool_pre_ping=True)


def _mysql_engine(url: str):
    return create_engine(url, pool_pre_ping=True)


def _migrate_table(sqlite_session: Session, mysql_session: Session, model):
    rows = sqlite_session.exec(select(model)).all()
    for row in rows:
        data = _dump_model(row)
        mysql_session.merge(model(**data))
    mysql_session.commit()
    return len(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sqlite", required=True)
    parser.add_argument("--mysql", required=True)
    args = parser.parse_args()

    sqlite_engine = _sqlite_engine(args.sqlite)
    mysql_engine = _mysql_engine(args.mysql)

    SQLModel.metadata.create_all(mysql_engine)

    with Session(sqlite_engine) as sqlite_session, Session(mysql_engine) as mysql_session:
        counts = {}
        counts["user"] = _migrate_table(sqlite_session, mysql_session, User)
        counts["profile"] = _migrate_table(sqlite_session, mysql_session, Profile)
        counts["checkin"] = _migrate_table(sqlite_session, mysql_session, Checkin)
        counts["anniversary"] = _migrate_table(sqlite_session, mysql_session, Anniversary)
        counts["album_meta"] = _migrate_table(sqlite_session, mysql_session, AlbumMeta)

    for k, v in counts.items():
        print(f"{k}: {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
