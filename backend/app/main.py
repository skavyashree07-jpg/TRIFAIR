from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from vault.router import router as vault_router

from .config import get_settings
from .db import init_db
from .routers import admin, auth, ngo, orders, price, public, verify


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
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
