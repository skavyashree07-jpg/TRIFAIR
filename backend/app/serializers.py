from __future__ import annotations

from .models import Artisan, Craft, Order, PayoutLedger, Product
from .pricing import calculate_price, check_listing


def product_price(p: Product):
    """Recompute the breakdown from stored components. Returns (PriceResult, effective_total)."""
    res = calculate_price(p.materials, p.hours, p.rate, p.ngo_cost, p.shipping, p.platform_fee)
    effective = res.total
    if p.listed_price is not None and p.price_review == "APPROVED":
        effective = check_listing(res, p.listed_price).effective_price
    return res, effective


def craft_out(c: Craft) -> dict:
    return {
        "id": c.id, "name": c.name, "tribe": c.tribe, "region": c.region, "history": c.history,
        "steps": c.steps, "symbols": c.symbols, "gi_status": c.gi_status,
        "consent_status": c.consent_status, "reviewed_on": c.reviewed_on, "sample": c.sample,
    }


def artisan_out(a: Artisan) -> dict:
    return {
        "id": a.id, "ngo_id": a.ngo_id, "display_name": a.display_name, "village": a.village,
        "craft_id": a.craft_id, "story": a.story, "consent_status": a.consent_status,
        "endorsed_by": a.endorsed_by, "status": a.status, "sample": a.sample,
    }


def product_out(p: Product, include_internal: bool = False) -> dict:
    res, effective = product_price(p)
    out = {
        "id": p.id, "artisan_id": p.artisan_id, "craft_id": p.craft_id, "title": p.title,
        "description": p.description, "images": p.images, "materials": float(p.materials),
        "hours": float(p.hours), "rate": float(p.rate), "ngo_cost": float(p.ngo_cost),
        "shipping": float(p.shipping), "platform_fee": float(p.platform_fee),
        "qr_token": p.qr_token, "status": p.status, "labels": p.labels,
        "verified_by": p.verified_by, "verified_on": p.verified_on, "sample": p.sample,
        "price": {**res.as_json(), "charged_total": float(effective)},
    }
    if include_internal:
        out.update(listed_price=float(p.listed_price) if p.listed_price is not None else None,
                   price_review=p.price_review, price_reason=p.price_reason)
    return out


def order_out(o: Order) -> dict:
    return {
        "id": o.id, "product_id": o.product_id, "quantity": o.quantity, "total": float(o.total),
        "status": o.status, "payment_status": o.payment_status, "created_at": o.created_at,
    }


def order_out_staff(o: Order) -> dict:
    return {**order_out(o), "artisan_share": float(o.artisan_share), "buyer_label": o.buyer_label}


def payout_out(p: PayoutLedger) -> dict:
    return {
        "id": p.id, "artisan_id": p.artisan_id, "order_id": p.order_id, "licence_id": p.licence_id,
        "kind": p.kind, "amount": float(p.amount), "status": p.status,
        "bank_reference": p.bank_reference, "paid_on": p.paid_on,
    }
