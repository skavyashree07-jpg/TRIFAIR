from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..config import get_settings
from ..db import get_db
from ..deps import limiter_dependency
from ..models import User
from ..ratelimit import SlidingWindowLimiter
from ..security import DUMMY_HASH, create_access_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

_limiter: SlidingWindowLimiter | None = None


def get_login_limiter() -> SlidingWindowLimiter:
    global _limiter
    if _limiter is None:
        _limiter = SlidingWindowLimiter(10, 60)
    return _limiter


def reset_login_limiter() -> None:
    global _limiter
    _limiter = None


class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=60)
    password: str = Field(min_length=1, max_length=200)


@router.post("/login", dependencies=[Depends(limiter_dependency(get_login_limiter, "login"))])
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == body.username))
    ok = verify_password(body.password, user.password_hash if user else DUMMY_HASH)
    if not user or not ok:
        raise HTTPException(401, "Wrong username or password")
    audit.append(db, user.username, user.role, "login", "user", user.id)
    db.commit()
    return {
        "access_token": create_access_token(user.id, user.role, user.ngo_id),
        "token_type": "bearer", "role": user.role, "ngo_id": user.ngo_id,
        "expires_in_hours": get_settings().jwt_hours,
    }
