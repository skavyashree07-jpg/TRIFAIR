from __future__ import annotations

import hashlib
import hmac
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import audit, consent
from ..config import get_settings
from ..db import get_db
from ..deps import get_current_user, limiter_dependency, new_id
from ..models import Artisan, Order, PaymentEvent, PayoutLedger, Product, User
from ..pricing import q2
from ..ratelimit import SlidingWindowLimiter
from ..serializers import order_out, order_out_staff, product_price

router = APIRouter(prefix="/api", tags=["orders"])

STATUS_FLOW = ["PLACED", "NGO_CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"]

_limiter: SlidingWindowLimiter | None = None


def get_order_limiter() -> SlidingWindowLimiter:
    global _limiter
    if _limiter is None:
        _limiter = SlidingWindowLimiter(20, 60)
    return _limiter


class OrderIn(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=100)
    buyer_label: str | None = Field(default=None, max_length=60)  # e.g. a nickname; no contact data


@router.post("/orders", status_code=201, dependencies=[Depends(limiter_dependency(get_order_limiter, "orders"))])
def create_order(body: OrderIn, db: Session = Depends(get_db)):
    """Sandbox order. Price and split are always recomputed here from stored components."""
    product = db.scalar(consent.public_products().where(Product.id == body.product_id))
    if not product:
        raise HTTPException(404, "Product not available")
    res, unit_total = product_price(product)
    artisan = db.get(Artisan, product.artisan_id)
    order = Order(
        id=new_id("ord"), product_id=product.id, quantity=body.quantity,
        total=q2(unit_total * body.quantity), artisan_share=q2(res.artisan_share * body.quantity),
        buyer_label=body.buyer_label, status="PLACED", payment_status="UNPAID", created_at=audit.now_iso(),
    )
    db.add(order)
    db.flush()
    db.add(PayoutLedger(
        id=new_id("pay"), ngo_id=artisan.ngo_id, artisan_id=artisan.id, order_id=order.id,
        kind="SALE", amount=order.artisan_share, status="PENDING",
    ))
    db.commit()
    return order_out(order)


@router.get("/orders/{order_id}")
def get_order(order_id: str, db: Session = Depends(get_db)):
    o = db.get(Order, order_id)
    if not o:
        raise HTTPException(404, "Order not found")
    return order_out(o)


class StatusIn(BaseModel):
    status: str


@router.patch("/orders/{order_id}/status")
def update_status(order_id: str, body: StatusIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("admin", "ngo"):
        raise HTTPException(403, "Not allowed")
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    artisan = db.get(Artisan, db.get(Product, order.product_id).artisan_id)
    if user.role == "ngo" and artisan.ngo_id != user.ngo_id:
        raise HTTPException(404, "Order not found")  # do not reveal other NGOs' orders
    if body.status not in STATUS_FLOW:
        raise HTTPException(422, f"status must be one of {STATUS_FLOW}")
    if body.status == order.status:
        return order_out_staff(order)  # idempotent
    if STATUS_FLOW.index(body.status) != STATUS_FLOW.index(order.status) + 1:
        raise HTTPException(409, f"Cannot move from {order.status} to {body.status}")
    old = order.status
    order.status = body.status
    if body.status == "DELIVERED":  # payout becomes ready once the order is delivered
        for led in db.scalars(select(PayoutLedger).where(PayoutLedger.order_id == order.id, PayoutLedger.status == "PENDING")):
            led.status = "READY"
    audit.append(db, user.username, user.role, "order_status", "order", order.id, {"from": old, "to": body.status})
    db.commit()
    return order_out_staff(order)


class CallbackIn(BaseModel):
    idempotency_key: str = Field(min_length=8, max_length=80)
    order_id: str
    status: str  # SUCCESS | FAILED


@router.post("/payments/callback")
async def payment_callback(request: Request, db: Session = Depends(get_db)):
    """Sandbox payment callback. Signed with HMAC and idempotent on idempotency_key."""
    raw = await request.body()
    expected = hmac.new(get_settings().payment_secret.encode(), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, request.headers.get("X-Signature", "")):
        raise HTTPException(401, "Bad signature")
    try:
        body = CallbackIn(**json.loads(raw))
    except Exception:
        raise HTTPException(422, "Invalid body") from None
    if body.status not in ("SUCCESS", "FAILED"):
        raise HTTPException(422, "status must be SUCCESS or FAILED")

    existing = db.get(PaymentEvent, body.idempotency_key)
    if existing:
        return {"duplicate": True, "order_id": existing.order_id, "status": existing.status}
    order = db.get(Order, body.order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    try:
        db.add(PaymentEvent(idempotency_key=body.idempotency_key, order_id=order.id, status=body.status, processed_at=audit.now_iso()))
        if order.payment_status == "UNPAID":
            order.payment_status = "PAID_SANDBOX" if body.status == "SUCCESS" else "FAILED"
        db.commit()
    except IntegrityError:  # two identical callbacks arrived together
        db.rollback()
        return {"duplicate": True, "order_id": order.id, "status": body.status}
    return {"duplicate": False, "order_id": order.id, "status": body.status}
