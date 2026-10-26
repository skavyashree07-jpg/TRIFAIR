"""QR tokens: random, unguessable, HMAC-signed. Pure functions."""
from __future__ import annotations

import base64
import hashlib
import hmac
import re
import secrets

_MAX_LEN = 80
_PATTERN = re.compile(r"^[A-Za-z0-9_-]{16,32}\.[A-Za-z0-9_-]{22}$")


def _sig(raw: str, secret: str) -> str:
    digest = hmac.new(secret.encode(), raw.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip("=")[:22]


def generate_token(secret: str) -> str:
    raw = secrets.token_urlsafe(16)  # 128 bits of randomness
    return f"{raw}.{_sig(raw, secret)}"


def has_valid_signature(token: str, secret: str) -> bool:
    """True only for well-formed tokens whose signature matches (constant time)."""
    if not isinstance(token, str) or len(token) > _MAX_LEN or not _PATTERN.match(token):
        return False
    raw, sig = token.split(".", 1)
    return hmac.compare_digest(sig, _sig(raw, secret))


def token_hash(token: str) -> str:
    """Stored in scan logs instead of the raw token."""
    return hashlib.sha256(token.encode()).hexdigest()
