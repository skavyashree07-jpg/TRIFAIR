from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import audit
from ..config import get_settings
from ..db import get_db
from ..deps import require_admin
from ..models import NGO, Artisan, AuditLog, Product, ScanLog, User
from ..serializers import product_out

router = APIRouter(prefix="/api/admin", tags=["admin"])

CHECKLIST = ("craft_claim", "evidence", "price", "consent")


@router.get("/queue")
def queue(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    pending_products = list(db.scalars(select(Product).where(Product.status == "PENDING")))
    return {
        "ngos": [{"id": n.id, "name": n.name, "region": n.region} for n in db.scalars(select(NGO).where(NGO.status == "PENDING"))],
        "products": [product_out(p, include_internal=True) for p in pending_products],
        "price_reviews": [
            {"product_id": p.id, "title": p.title, "listed_price": float(p.listed_price), "calculated_total": product_out(p)["price"]["total"]}
            for p in pending_products if p.price_review == "PENDING"
        ],
    }


class ApproveIn(BaseModel):
    type: str  # ngo | product
    reason: str | None = Field(default=None, max_length=1000)
    checklist: dict[str, bool] | None = None


@router.post("/approve/{target_id}")
def approve(target_id: str, body: ApproveIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    today = audit.now_iso()[:10]
    if body.type == "ngo":
        ngo = db.get(NGO, target_id)
        if not ngo:
            raise HTTPException(404, "NGO not found")
        if ngo.status != "PENDING":
            raise HTTPException(409, f"NGO is {ngo.status}, not PENDING")
        ngo.status, ngo.verified_on = "ACTIVE", today
        audit.append(db, admin.username, "admin", "ngo_approved", "ngo", ngo.id)
        db.commit()
        return {"id": ngo.id, "status": ngo.status}

    if body.type == "product":
        p = db.get(Product, target_id)
        if not p:
            raise HTTPException(404, "Product not found")
        if p.status != "PENDING":
            raise HTTPException(409, f"Product is {p.status}, not PENDING")
        if not body.checklist or not all(body.checklist.get(k) is True for k in CHECKLIST):
            raise HTTPException(422, f"All checklist items must be true: {', '.join(CHECKLIST)}")
        artisan = db.get(Artisan, p.artisan_id)
        ngo = db.get(NGO, artisan.ngo_id)
        if artisan.consent_status != "consented" or artisan.status != "ACTIVE":
            raise HTTPException(422, "Artisan consent is not recorded as consented")
        if ngo.status != "ACTIVE":
            raise HTTPException(422, "The NGO is not active")
        detail = {"checklist": body.checklist}
        if p.price_review == "PENDING":
            if not body.reason or len(body.reason.strip()) < 10:
                raise HTTPException(422, "A recorded reason (at least 10 characters) is required for a below-minimum price")
            p.price_review, p.price_reason = "APPROVED", body.reason.strip()
            detail["price_override_reason"] = p.price_reason
            audit.append(db, admin.username, "admin", "price_override_approved", "product", p.id,
                         {"listed_price": str(p.listed_price), "reason": p.price_reason})
        p.status, p.verified_by, p.verified_on = "VERIFIED", admin.username, today
        if "NGO-verified" not in p.labels:
            p.labels = [*p.labels, "NGO-verified"]
        audit.append(db, admin.username, "admin", "product_approved", "product", p.id, detail)
        db.commit()
        return {"id": p.id, "status": p.status}
    raise HTTPException(422, "type must be ngo or product")


class RevokeIn(BaseModel):
    type: str  # product | artisan | ngo
    reason: str = Field(min_length=5, max_length=1000)


@router.post("/revoke/{target_id}")
def revoke(target_id: str, body: RevokeIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Takes effect on /api/verify immediately because verify reads live state."""
    if body.type == "product":
        obj, field, new = db.get(Product, target_id), "status", "REVOKED"
    elif body.type == "artisan":
        obj, field, new = db.get(Artisan, target_id), "status", "SUSPENDED"
    elif body.type == "ngo":
        obj, field, new = db.get(NGO, target_id), "status", "REVOKED"
    else:
        raise HTTPException(422, "type must be product, artisan or ngo")
    if obj is None:
        raise HTTPException(404, f"{body.type} not found")
    if getattr(obj, field) == new:
        raise HTTPException(409, f"Already {new}")
    old = getattr(obj, field)
    setattr(obj, field, new)
    audit.append(db, admin.username, "admin", f"{body.type}_revoked", body.type, target_id, {"from": old, "to": new, "reason": body.reason})
    db.commit()
    return {"id": target_id, "type": body.type, "status": new}


@router.get("/audit")
def audit_log(limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0), _: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(limit).offset(offset))
    return [audit.row_to_dict(r) for r in rows]


@router.get("/audit/verify")
def audit_verify(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    ok, bad_id = audit.verify_db_chain(db)
    return {"ok": ok, "first_bad_id": bad_id}


@router.get("/scan-alerts")
def scan_alerts(hours: int = Query(1, ge=1, le=168), _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Tokens scanned unusually often (possible copied code)."""
    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat(timespec="seconds")
    threshold = get_settings().scan_alert_threshold * hours
    q = (select(ScanLog.product_id, func.count().label("n")).where(ScanLog.scanned_at >= since, ScanLog.product_id.is_not(None))
         .group_by(ScanLog.product_id).having(func.count() >= threshold).order_by(func.count().desc()))
    return [{"product_id": pid, "scans": n, "window_hours": hours, "threshold": threshold} for pid, n in db.execute(q)]
