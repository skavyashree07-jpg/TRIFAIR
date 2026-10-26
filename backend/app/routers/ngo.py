from __future__ import annotations

import re
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit, qr
from ..config import get_settings
from ..db import get_db
from ..deps import new_id, require_ngo
from ..models import Artisan, Craft, Order, PayoutLedger, Product, User
from ..pricing import PricingError, calculate_price, check_listing, platform_fee_for
from ..serializers import artisan_out, order_out_staff, payout_out, product_out

router = APIRouter(prefix="/api/ngo", tags=["ngo"])

_REF = re.compile(r"^[A-Za-z0-9/_-]{4,40}$")


class ArtisanIn(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)  # a display name or alias only
    village: str = Field(min_length=1, max_length=120)  # village name only, never precise location
    craft_id: str
    story: str = Field(default="", max_length=4000)
    consent_status: str = "pending"
    endorsed_by: str | None = Field(default=None, max_length=160)


@router.post("/artisans", status_code=201)
def create_artisan(body: ArtisanIn, user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    if body.consent_status not in ("pending", "consented", "withdrawn"):
        raise HTTPException(422, "consent_status must be pending, consented or withdrawn")
    if not db.get(Craft, body.craft_id):
        raise HTTPException(422, "Unknown craft_id")
    a = Artisan(id=new_id("art"), ngo_id=user.ngo_id, status="ACTIVE", sample=False, **body.model_dump())
    db.add(a)
    audit.append(db, user.username, "ngo", "artisan_created", "artisan", a.id, {"consent_status": a.consent_status})
    db.commit()
    return artisan_out(a)


@router.get("/artisans")
def my_artisans(user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    return [artisan_out(a) for a in db.scalars(select(Artisan).where(Artisan.ngo_id == user.ngo_id))]


class ProductIn(BaseModel):
    artisan_id: str
    craft_id: str
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=4000)
    images: list[str] = Field(default_factory=list, max_length=12)
    materials: float = Field(ge=0)
    hours: float = Field(ge=0)
    rate: float = Field(ge=0)
    ngo_cost: float = Field(ge=0)
    shipping: float = Field(ge=0)
    listed_price: float | None = Field(default=None, ge=0)  # only for a below-minimum request


@router.post("/products", status_code=201)
def create_product(body: ProductIn, user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    artisan = db.get(Artisan, body.artisan_id)
    if not artisan or artisan.ngo_id != user.ngo_id:
        raise HTTPException(404, "Artisan not found")
    if not db.get(Craft, body.craft_id):
        raise HTTPException(422, "Unknown craft_id")
    try:
        labour = calculate_price(body.materials, body.hours, body.rate, 0, 0, 0)
        fee = platform_fee_for(labour.artisan_share, body.ngo_cost, body.shipping, get_settings().platform_fee_pct)  # server decides the fee
        res = calculate_price(body.materials, body.hours, body.rate, body.ngo_cost, body.shipping, fee)
        check = check_listing(res, body.listed_price)
    except PricingError as e:
        raise HTTPException(422, str(e)) from None
    p = Product(
        id=new_id("prod"), artisan_id=artisan.id, craft_id=body.craft_id, title=body.title,
        description=body.description, images=body.images, materials=res.materials, hours=body.hours,
        rate=body.rate, ngo_cost=res.ngo, shipping=res.shipping, platform_fee=res.fee,
        listed_price=check.effective_price if check.below_minimum else None,
        price_review="PENDING" if check.below_minimum else "NONE",
        qr_token=qr.generate_token(get_settings().qr_secret), status="PENDING", labels=[], sample=False,
    )
    db.add(p)
    audit.append(db, user.username, "ngo", "product_created", "product", p.id,
                 {"below_minimum": check.below_minimum, "total": str(res.total)})
    db.commit()
    return product_out(p, include_internal=True)


def _my_products_query(ngo_id: str):
    return select(Product).join(Artisan, Product.artisan_id == Artisan.id).where(Artisan.ngo_id == ngo_id)


@router.get("/products")
def my_products(user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    return [product_out(p, include_internal=True) for p in db.scalars(_my_products_query(user.ngo_id))]


@router.get("/orders")
def my_orders(user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    q = (select(Order).join(Product, Order.product_id == Product.id)
         .join(Artisan, Product.artisan_id == Artisan.id).where(Artisan.ngo_id == user.ngo_id)
         .order_by(Order.created_at.desc()))
    return [order_out_staff(o) for o in db.scalars(q)]


@router.get("/payouts")
def my_payouts(user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    return [payout_out(p) for p in db.scalars(select(PayoutLedger).where(PayoutLedger.ngo_id == user.ngo_id).order_by(PayoutLedger.id))]


class PayoutPatch(BaseModel):
    status: str
    bank_reference: str | None = None  # a transaction reference only; never account numbers


_NEXT = {"PENDING": "READY", "READY": "PAID"}


@router.patch("/payouts/{payout_id}")
def update_payout(payout_id: str, body: PayoutPatch, user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    led = db.get(PayoutLedger, payout_id)
    if not led or led.ngo_id != user.ngo_id:
        raise HTTPException(404, "Payout not found")
    if body.status not in ("PENDING", "READY", "PAID"):
        raise HTTPException(422, "status must be PENDING, READY or PAID")
    if body.bank_reference is not None and not _REF.match(body.bank_reference):
        raise HTTPException(422, "bank_reference must be 4-40 letters, digits, / _ - (a reference, not account details)")
    if body.status == led.status:
        if body.status == "PAID" and body.bank_reference not in (None, led.bank_reference):
            raise HTTPException(409, "Payout already paid with a different reference")
        return payout_out(led)  # idempotent repeat
    if _NEXT.get(led.status) != body.status:
        raise HTTPException(409, f"Cannot move from {led.status} to {body.status}")
    if body.status == "PAID":
        if not body.bank_reference:
            raise HTTPException(422, "bank_reference is required to mark a payout PAID")
        led.bank_reference = body.bank_reference
        led.paid_on = audit.now_iso()[:10]
    old = led.status
    led.status = body.status
    audit.append(db, user.username, "ngo", "payout_status", "payout", led.id,
                 {"from": old, "to": body.status, "kind": led.kind})
    db.commit()
    return payout_out(led)
