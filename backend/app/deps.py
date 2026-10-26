from __future__ import annotations

import secrets

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .db import get_db
from .models import NGO, User
from .ratelimit import SlidingWindowLimiter
from .security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(5)}"


def client_key(request: Request) -> str:
    # Behind a reverse proxy, configure the proxy to set the real client address.
    return request.client.host if request.client else "unknown"


def limiter_dependency(limiter_getter, name: str):
    def dep(request: Request):
        if not limiter_getter().allow(f"{name}:{client_key(request)}"):
            raise HTTPException(status_code=429, detail="Too many requests. Please wait a minute.")

    return dep


def get_optional_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User | None:
    if not creds:
        return None
    payload = decode_access_token(creds.credentials)
    if not payload:
        return None
    return db.get(User, payload.get("sub"))


def get_current_user(user: User | None = Depends(get_optional_user)) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Login required", headers={"WWW-Authenticate": "Bearer"})
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def require_ngo(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if user.role != "ngo" or not user.ngo_id:
        raise HTTPException(status_code=403, detail="NGO only")
    ngo = db.get(NGO, user.ngo_id)
    if ngo is None or ngo.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="NGO account is not active")
    return user


def require_staff(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    """Admin, or an active NGO user."""
    if user.role == "admin":
        return user
    return require_ngo(user, db)
