from app.audit_chain import GENESIS, compute_hash, verify_chain


def make(n):
    rows, prev = [], GENESIS
    for i in range(n):
        e = {"ts": f"2026-01-0{i+1}", "actor": "admin", "actor_role": "admin", "action": "x",
             "target_type": "product", "target_id": f"p{i}", "detail": None}
        h = compute_hash(prev, e)
        rows.append({**e, "prev_hash": prev, "hash": h})
        prev = h
    return rows


def test_valid_chain():
    assert verify_chain(make(5)) == (True, None)
    assert verify_chain([]) == (True, None)


def test_edit_detected():
    rows = make(5)
    rows[2]["action"] = "tampered"
    assert verify_chain(rows) == (False, 2)


def test_deletion_detected():
    rows = make(5)
    del rows[1]
    assert verify_chain(rows)[0] is False


def test_reorder_detected():
    rows = make(4)
    rows[1], rows[2] = rows[2], rows[1]
    assert verify_chain(rows)[0] is False
