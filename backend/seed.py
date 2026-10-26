"""Load /data into the database: python seed.py [--reset]

Creates demo users (admin, ngo_one, ngo_two) with a password from
TRIFAIR_DEMO_PASSWORD, or a random one that is printed once.
"""
from __future__ import annotations

import json
import os
import secrets
import sys
from decimal import Decimal

from sqlalchemy import select

from app import audit, qr
from app.config import get_settings
from app.db import Base, SessionLocal, engine, init_db
from app.models import (NGO, Artisan, Craft, Design, Licence, Order, PayoutLedger, Product, User)
from app.pricing import calculate_price, q2
from app.security import hash_password


def load(name: str) -> list[dict]:
    path = get_settings().data_dir / name
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []


def cols(model, rec: dict) -> dict:
    names = {c.name for c in model.__table__.columns}
    return {k: v for k, v in rec.items() if k in names}


def seed(db, demo_password: str) -> dict:
    s = get_settings()
    for rec in load("crafts.json"):
        db.add(Craft(**cols(Craft, rec)))
    for rec in load("ngos.json"):
        db.add(NGO(**cols(NGO, rec)))
    db.flush()
    for rec in load("artisans.json"):
        db.add(Artisan(**cols(Artisan, rec)))
    db.flush()
    for rec in load("products.json"):
        rec = dict(rec)
        if not qr.has_valid_signature(rec.get("qr_token", ""), s.qr_secret):
            rec["qr_token"] = qr.generate_token(s.qr_secret)  # never trust placeholder tokens
        db.add(Product(**cols(Product, rec)))
    db.flush()
    shares: dict[str, Decimal] = {}
    for rec in load("orders.json"):
        p = db.get(Product, rec["product_id"])
        res = calculate_price(p.materials, p.hours, p.rate, p.ngo_cost, p.shipping, p.platform_fee)
        qty = rec.get("quantity", 1)
        rec = {**rec, "quantity": qty, "total": q2(res.total * qty), "artisan_share": q2(res.artisan_share * qty)}
        shares[rec["id"]] = rec["artisan_share"]
        db.add(Order(**cols(Order, rec)))
    db.flush()
    for rec in load("payouts.json"):
        art = db.get(Artisan, rec["artisan_id"])
        rec = {**rec, "ngo_id": art.ngo_id, "kind": "SALE", "amount": rec.get("amount", shares.get(rec.get("order_id"), 0))}
        db.add(PayoutLedger(**cols(PayoutLedger, rec)))
    for rec in load("designs.json"):
        db.add(Design(**cols(Design, rec)))
    db.flush()
    for rec in load("licences.json"):
        rec = {**rec, "created_at": audit.now_iso()}
        db.add(Licence(**cols(Licence, rec)))
    users = [("admin", "admin", None), ("ngo_one", "ngo", "ngo_s1"), ("ngo_two", "ngo", "ngo_s2")]
    for name, role, ngo_id in users:
        db.add(User(id=f"user_{name}", username=name, password_hash=hash_password(demo_password), role=role, ngo_id=ngo_id))
    audit.append(db, "seed", "admin", "seed_loaded", "database", "all", {"source": "data/"})
    db.commit()
    return {"products": db.query(Product).count(), "crafts": db.query(Craft).count()}


def main() -> None:
    if "--reset" in sys.argv:
        Base.metadata.drop_all(engine)
    init_db()
    with SessionLocal() as db:
        if db.scalar(select(Craft).limit(1)):
            print("Database already seeded. Use --reset to start over.")
            return
        pw = os.environ.get("TRIFAIR_DEMO_PASSWORD") or secrets.token_urlsafe(9)
        counts = seed(db, pw)
        print(f"Seeded {counts}")
        print("Demo logins: admin / ngo_one / ngo_two, password:", pw if not os.environ.get("TRIFAIR_DEMO_PASSWORD") else "(from TRIFAIR_DEMO_PASSWORD)")
        s = get_settings()
        forged = qr.generate_token("not-the-real-secret-xxxxxxxx")
        print("NOT_FOUND demo code:", forged)
        for p in db.scalars(select(Product).order_by(Product.id)):
            print(f"  {p.id:10} {p.status:9} {p.qr_token}")


if __name__ == "__main__":
    main()
