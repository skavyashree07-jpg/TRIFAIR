"""Community Design Vault API (Person 4 owns this folder; working version provided by Person 2).

Wording: a dated record and a licensing route. Not legal protection.
"""
from __future__ import annotations

import re
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import audit, consent
from app.db import get_db
from app.deps import get_optional_user, limiter_dependency, new_id, require_ngo, require_staff
from app.models import Design, Licence, PayoutLedger, User
from app.ratelimit import SlidingWindowLimiter

router = APIRouter(prefix="/api/vault", tags=["vault"])

NOTE = ("A dated record and a licensing route. It does not replace GI, design or copyright law. "
        "Sacred designs can be marked view-only.")
TERMS = {
    "NOT_AVAILABLE": "Not available for licensing. View only.",
    "NON_COMMERCIAL": "Available for non-commercial use on request and approval.",
    "COMMERCIAL": "Available for commercial use on request, approval and an agreed fee.",
}
_HASH = re.compile(r"^[0-9a-f]{64}$")

_limiter: SlidingWindowLimiter | None = None


def get_licence_limiter() -> SlidingWindowLimiter:
    global _limiter
    if _limiter is None:
        _limiter = SlidingWindowLimiter(10, 60)
    return _limiter


def passport(d: Design) -> dict:
    return {
        "id": d.id, "community": d.community, "title": d.title, "meaning": d.meaning,
        "file_hash": d.file_hash, "hash_algorithm": "SHA-256", "registered_on": d.registered_on,
        "consent_status": d.consent_status, "licence_policy": d.licence_policy,
        "licence_terms": TERMS[d.licence_policy], "visibility": d.visibility, "note": NOTE, "sample": d.sample,
    }


class DesignIn(BaseModel):
    community: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=160)
    meaning: str = Field(min_length=1, max_length=4000)
    file_hash: str  # SHA-256 computed in the browser
    consent_status: str = "pending"
    licence_policy: str = "NOT_AVAILABLE"
    visibility: str = "public"


@router.post("/designs", status_code=201)
def register_design(body: DesignIn, user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    h = body.file_hash.lower()
    if not _HASH.match(h):
        raise HTTPException(422, "file_hash must be a 64-character hex SHA-256")
    if body.consent_status not in ("pending", "consented", "withdrawn"):
        raise HTTPException(422, "consent_status must be pending, consented or withdrawn")
    if body.licence_policy not in TERMS:
        raise HTTPException(422, f"licence_policy must be one of {list(TERMS)}")
    if body.visibility not in ("public", "view_only", "private"):
        raise HTTPException(422, "visibility must be public, view_only or private")
    d = Design(id=new_id("des"), ngo_id=user.ngo_id, file_hash=h, registered_on=audit.now_iso()[:10], sample=False,
               **body.model_dump(exclude={"file_hash"}))
    db.add(d)
    try:
        audit.append(db, user.username, "ngo", "design_registered", "design", d.id, {"file_hash": h})
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A design with this file hash is already registered") from None
    return passport(d)


@router.get("/designs")
def list_designs(db: Session = Depends(get_db)):
    return [passport(d) for d in db.scalars(consent.public_designs().order_by(Design.title))]


@router.get("/designs/{design_id}")
def get_design(design_id: str, user: User | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    d = db.get(Design, design_id)
    allowed = d is not None and (
        (d.consent_status == "consented" and d.visibility != "private")
        or (user is not None and (user.role == "admin" or user.ngo_id == d.ngo_id))
    )
    if not allowed:
        raise HTTPException(404, "Design not found")
    return passport(d)


class LicenceIn(BaseModel):
    design_id: str
    requester: str = Field(min_length=1, max_length=120)  # organisation or alias; no personal contact data
    purpose: str = Field(min_length=3, max_length=2000)
    quantity: int = Field(default=1, ge=1, le=1_000_000)


def licence_out(l: Licence) -> dict:
    return {"id": l.id, "design_id": l.design_id, "requester": l.requester, "purpose": l.purpose,
            "quantity": l.quantity, "status": l.status, "fee": float(l.fee) if l.fee is not None else None}


@router.post("/licences", status_code=201, dependencies=[Depends(limiter_dependency(get_licence_limiter, "licence"))])
def request_licence(body: LicenceIn, db: Session = Depends(get_db)):
    d = db.scalar(consent.public_designs().where(Design.id == body.design_id))
    if not d:
        raise HTTPException(404, "Design not found")
    if d.visibility == "view_only" or d.licence_policy == "NOT_AVAILABLE":
        raise HTTPException(403, "This design is view-only and not available for licensing")
    l = Licence(id=new_id("lic"), design_id=d.id, status="REQUESTED", created_at=audit.now_iso(), sample=False, **body.model_dump(exclude={"design_id"}))
    db.add(l)
    db.commit()
    return licence_out(l)


@router.get("/licences")
def list_licences(user: User = Depends(require_staff), db: Session = Depends(get_db)):
    q = select(Licence).join(Design, Licence.design_id == Design.id).order_by(Licence.created_at.desc())
    if user.role == "ngo":
        q = q.where(Design.ngo_id == user.ngo_id)
    return [licence_out(l) for l in db.scalars(q)]


class LicenceDecision(BaseModel):
    status: str  # APPROVED | DECLINED
    fee: float | None = Field(default=None, ge=0, le=10_000_000)


@router.patch("/licences/{licence_id}")
def decide_licence(licence_id: str, body: LicenceDecision, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    l = db.get(Licence, licence_id)
    d = db.get(Design, l.design_id) if l else None
    if not l or (user.role == "ngo" and d.ngo_id != user.ngo_id):
        raise HTTPException(404, "Licence request not found")
    if body.status not in ("APPROVED", "DECLINED"):
        raise HTTPException(422, "status must be APPROVED or DECLINED")
    if l.status == body.status:
        return licence_out(l)  # idempotent repeat
    if l.status != "REQUESTED":
        raise HTTPException(409, f"Licence is already {l.status}")
    l.status, l.decided_by, l.decided_on = body.status, user.username, audit.now_iso()[:10]
    if body.status == "APPROVED":
        l.fee = Decimal(str(body.fee)) if body.fee is not None else Decimal("0")
        if l.fee > 0:  # royalty entry in the payout ledger
            db.add(PayoutLedger(id=new_id("pay"), ngo_id=d.ngo_id, artisan_id=None, order_id=None, licence_id=l.id,
                                kind="ROYALTY", amount=l.fee, status="PENDING"))
    audit.append(db, user.username, user.role, f"licence_{body.status.lower()}", "licence", l.id,
                 {"design_id": d.id, "fee": str(l.fee) if l.fee is not None else None})
    db.commit()
    return licence_out(l)
