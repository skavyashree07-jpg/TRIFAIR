"""Writes to and verifies the hash-chained audit log."""
from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .audit_chain import GENESIS, compute_hash, verify_chain
from .models import AuditLog


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def append(db: Session, actor: str, role: str, action: str, target_type: str, target_id: str, detail: dict | None = None) -> AuditLog:
    """Add an entry in the caller's transaction (the caller commits)."""
    last = db.scalar(select(AuditLog).order_by(AuditLog.id.desc()).limit(1))
    prev = last.hash if last else GENESIS
    entry = {
        "ts": now_iso(),
        "actor": actor,
        "actor_role": role,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "detail": json.dumps(detail, sort_keys=True, ensure_ascii=False) if detail else None,
    }
    row = AuditLog(**entry, prev_hash=prev, hash=compute_hash(prev, entry))
    db.add(row)
    db.flush()
    return row


def row_to_dict(r: AuditLog) -> dict:
    return {
        "id": r.id, "ts": r.ts, "actor": r.actor, "actor_role": r.actor_role, "action": r.action,
        "target_type": r.target_type, "target_id": r.target_id, "detail": r.detail,
        "prev_hash": r.prev_hash, "hash": r.hash,
    }


def verify_db_chain(db: Session) -> tuple[bool, int | None]:
    rows = [row_to_dict(r) for r in db.scalars(select(AuditLog).order_by(AuditLog.id))]
    ok, bad = verify_chain(rows)
    return ok, (rows[bad]["id"] if bad is not None else None)
