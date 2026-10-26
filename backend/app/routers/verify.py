from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import qr
from ..audit import now_iso
from ..config import get_settings
from ..db import get_db
from ..deps import limiter_dependency
from ..models import NGO, Artisan, Product, ScanLog
from ..ratelimit import SlidingWindowLimiter

router = APIRouter(prefix="/api", tags=["verify"])

_limiter: SlidingWindowLimiter | None = None


def get_verify_limiter() -> SlidingWindowLimiter:
    global _limiter
    if _limiter is None:
        _limiter = SlidingWindowLimiter(get_settings().verify_rate_limit_per_min, 60)
    return _limiter


def reset_verify_limiter() -> None:  # used by tests
    global _limiter
    _limiter = None


def _empty(state: str, message: str) -> dict:
    return {"state": state, "artisan": None, "village": None, "ngo": None, "verified_on": None, "labels": [], "message": message}


@router.get("/verify/{token}", dependencies=[Depends(limiter_dependency(get_verify_limiter, "verify"))])
def verify(token: str, db: Session = Depends(get_db)):
    """Live lookup on every call, so revoking a product changes the result at once."""
    s = get_settings()
    if not qr.has_valid_signature(token, s.qr_secret):
        return _empty("NOT_FOUND", "This code is not recognised.")
    product = db.scalar(select(Product).where(Product.qr_token == token))
    if product is None:
        return _empty("NOT_FOUND", "This code is not recognised.")

    db.add(ScanLog(product_id=product.id, token_hash=qr.token_hash(token), scanned_at=now_iso()))
    db.commit()

    artisan = db.get(Artisan, product.artisan_id)
    ngo = db.get(NGO, artisan.ngo_id) if artisan else None
    consented = bool(artisan and ngo and artisan.consent_status == "consented" and ngo.consent_status == "consented")

    revoked = (
        product.status == "REVOKED"
        or (artisan is not None and artisan.status != "ACTIVE")
        or (ngo is not None and ngo.status in ("SUSPENDED", "REVOKED"))
    )
    if revoked:
        state = "REVOKED"
    elif product.status == "PENDING" or ngo is None or ngo.status != "ACTIVE" or not consented:
        state = "PENDING"
    else:
        state = "VERIFIED"

    if state == "PENDING":
        return _empty("PENDING", "This item has not finished verification yet.")
    if state == "REVOKED":
        out = _empty("REVOKED", "This verification has been withdrawn. Do not rely on this code.")
        if consented:
            out.update(artisan=artisan.display_name, village=artisan.village, ngo=ngo.name)
        return out
    return {
        "state": "VERIFIED", "artisan": artisan.display_name, "village": artisan.village, "ngo": ngo.name,
        "verified_on": product.verified_on, "labels": product.labels,
        "message": "Traced to a verified artisan and NGO.",
    }
