"""Settings read from environment variables. No secrets live in code."""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


class ConfigError(RuntimeError):
    pass


def _secret(name: str) -> str:
    value = os.environ.get(name, "")
    if len(value) < 16:
        raise ConfigError(
            f"{name} must be set to a random string of at least 16 characters "
            "(see .env.example)."
        )
    return value


@dataclass(frozen=True)
class Settings:
    qr_secret: str
    jwt_secret: str
    payment_secret: str
    db_url: str
    data_dir: Path
    platform_fee_pct: float
    verify_rate_limit_per_min: int
    scan_alert_threshold: int  # scans of one token per hour before it is flagged
    cors_origins: list[str]
    jwt_hours: int = 8


@lru_cache
def get_settings() -> Settings:
    return Settings(
        qr_secret=_secret("TRIFAIR_QR_SECRET"),
        jwt_secret=_secret("TRIFAIR_JWT_SECRET"),
        payment_secret=_secret("TRIFAIR_PAYMENT_SECRET"),
        db_url=os.environ.get("TRIFAIR_DB_URL", "sqlite:///./trifair.db"),
        data_dir=Path(os.environ.get("TRIFAIR_DATA_DIR", "../data")),
        platform_fee_pct=float(os.environ.get("TRIFAIR_PLATFORM_FEE_PCT", "5")),
        verify_rate_limit_per_min=int(os.environ.get("TRIFAIR_VERIFY_RATE_LIMIT", "30")),
        scan_alert_threshold=int(os.environ.get("TRIFAIR_SCAN_ALERT_THRESHOLD", "20")),
        cors_origins=[
            o.strip()
            for o in os.environ.get("TRIFAIR_CORS_ORIGINS", "http://localhost:5173").split(",")
            if o.strip()
        ],
    )
