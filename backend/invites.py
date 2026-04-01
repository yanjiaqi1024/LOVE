from __future__ import annotations

import secrets


def generate_invite_code() -> str:
    return secrets.token_urlsafe(18).replace("-", "").replace("_", "")

