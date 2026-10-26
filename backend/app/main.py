from __future__ import annotations

import os
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from vault.router import router as vault_router

from .config import get_settings
from .db import SessionLocal, init_db
from .models import Craft
from .routers import admin, auth, ngo, orders, price, public, verify


def seed_demo_database_if_empty() -> None:
    """Seed synthetic demo rows only when the host explicitly enables it."""
    if os.environ.get("TRIFAIR_AUTO_SEED", "false").lower() != "true":
        return

    with SessionLocal() as db:
        if db.scalar(select(Craft.id).limit(1)) is not None:
            return

        # Render's free filesystem is temporary, so restore synthetic records
        # after a cold start. This never resets a database containing records.
        import seed

        password = os.environ.get("TRIFAIR_DEMO_PASSWORD") or secrets.token_urlsafe(18)
        seed.seed(db, password)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    seed_demo_database_if_empty()
    yield


app = FastAPI(
    title="TRIFAIR API",
    description="Sample data and demo only. No real payments. Independent student project.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware, allow_origins=get_settings().cors_origins, allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Signature"],
)
for r in (public.router, price.router, verify.router, auth.router, orders.router, ngo.router, admin.router, vault_router):
    app.include_router(r)


@app.get("/api/health", tags=["meta"])
def health():
    return {"ok": True, "notice": "Sample data and demo only. No real payments. Independent student project."}
