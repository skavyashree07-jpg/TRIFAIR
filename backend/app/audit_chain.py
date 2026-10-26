"""Hash chain for the append-only audit log. Pure functions."""
from __future__ import annotations

import hashlib
import json

GENESIS = "0" * 64
FIELDS = ("ts", "actor", "actor_role", "action", "target_type", "target_id", "detail")


def compute_hash(prev_hash: str, entry: dict) -> str:
    payload = json.dumps({k: entry.get(k) for k in FIELDS}, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256((prev_hash + payload).encode()).hexdigest()


def verify_chain(rows: list[dict]) -> tuple[bool, int | None]:
    """rows must be in insertion order. Returns (ok, index_of_first_bad_row)."""
    prev = GENESIS
    for i, row in enumerate(rows):
        if row.get("prev_hash") != prev or row.get("hash") != compute_hash(prev, row):
            return False, i
        prev = row["hash"]
    return True, None
