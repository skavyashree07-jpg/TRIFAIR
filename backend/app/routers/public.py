from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import consent
from ..db import get_db
from ..models import Artisan, Craft, Product
from ..serializers import artisan_out, craft_out, product_out

router = APIRouter(prefix="/api", tags=["public"])


@router.get("/crafts")
def list_crafts(db: Session = Depends(get_db)):
    return [craft_out(c) for c in db.scalars(consent.public_crafts().order_by(Craft.name))]


@router.get("/crafts/{craft_id}")
def get_craft(craft_id: str, db: Session = Depends(get_db)):
    c = db.scalar(consent.public_crafts().where(Craft.id == craft_id))
    if not c:
        raise HTTPException(404, "Craft not found")
    return craft_out(c)


@router.get("/artisans")
def list_artisans(craft_id: str | None = None, db: Session = Depends(get_db)):
    q = consent.public_artisans().order_by(Artisan.display_name)
    if craft_id:
        q = q.where(Artisan.craft_id == craft_id)
    return [artisan_out(a) for a in db.scalars(q)]


@router.get("/artisans/{artisan_id}")
def get_artisan(artisan_id: str, db: Session = Depends(get_db)):
    a = db.scalar(consent.public_artisans().where(Artisan.id == artisan_id))
    if not a:
        raise HTTPException(404, "Artisan not found")
    return artisan_out(a)


@router.get("/products")
def list_products(craft_id: str | None = None, artisan_id: str | None = None, db: Session = Depends(get_db)):
    q = consent.public_products().order_by(Product.title)
    if craft_id:
        q = q.where(Product.craft_id == craft_id)
    if artisan_id:
        q = q.where(Product.artisan_id == artisan_id)
    return [product_out(p) for p in db.scalars(q)]


@router.get("/products/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)):
    p = db.scalar(consent.public_products().where(Product.id == product_id))
    if not p:
        raise HTTPException(404, "Product not found")
    return product_out(p)
