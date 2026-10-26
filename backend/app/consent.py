"""Central consent filter. Public queries MUST be built from these helpers."""
from __future__ import annotations

from sqlalchemy import select

from .models import NGO, Artisan, Craft, Design, Product

CONSENTED = "consented"


def public_crafts():
    return select(Craft).where(Craft.consent_status == CONSENTED)


def public_artisans():
    return (
        select(Artisan)
        .join(NGO, Artisan.ngo_id == NGO.id)
        .join(Craft, Artisan.craft_id == Craft.id)
        .where(
            Artisan.consent_status == CONSENTED,
            Artisan.status == "ACTIVE",
            NGO.status == "ACTIVE",
            NGO.consent_status == CONSENTED,
            Craft.consent_status == CONSENTED,
        )
    )


def public_products():
    """Shop listing: verified, with consented artisan, craft and NGO, all active."""
    return (
        select(Product)
        .join(Artisan, Product.artisan_id == Artisan.id)
        .join(NGO, Artisan.ngo_id == NGO.id)
        .join(Craft, Product.craft_id == Craft.id)
        .where(
            Product.status == "VERIFIED",
            Artisan.consent_status == CONSENTED,
            Artisan.status == "ACTIVE",
            NGO.status == "ACTIVE",
            NGO.consent_status == CONSENTED,
            Craft.consent_status == CONSENTED,
        )
    )


def public_designs():
    return select(Design).where(Design.consent_status == CONSENTED, Design.visibility != "private")
