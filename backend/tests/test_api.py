"""End-to-end API tests (need fastapi, sqlalchemy, httpx installed: pip install -r requirements.txt)."""
import hashlib
import hmac
import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, text

PW = "demo-pass-123"


@pytest.fixture(scope="session")
def client():
    from app.db import SessionLocal
    from app.main import app
    import seed

    with TestClient(app) as c:  # runs startup, creating tables
        with SessionLocal() as db:
            seed.seed(db, PW)
        yield c


@pytest.fixture(autouse=True)
def _reset_limiters():
    from app.routers import auth, verify
    verify.reset_verify_limiter()
    auth.reset_login_limiter()


def login(client, username):
    r = client.post("/api/auth/login", json={"username": username, "password": PW})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def token_of(product_id):
    from app.db import SessionLocal
    from app.models import Product
    with SessionLocal() as db:
        return db.get(Product, product_id).qr_token


def new_verified_product(client, price_extra=None):
    """Create artisan + product as ngo_one, approve as admin. Returns (product_id, token)."""
    ngo, admin = login(client, "ngo_one"), login(client, "admin")
    a = client.post("/api/ngo/artisans", headers=ngo, json={
        "display_name": "Sample Test Artisan", "village": "Sample Village", "craft_id": "craft_warli",
        "story": "Invented.", "consent_status": "consented"}).json()
    p = client.post("/api/ngo/products", headers=ngo, json={
        "artisan_id": a["id"], "craft_id": "craft_warli", "title": "Sample test product",
        "materials": 100, "hours": 1, "rate": 100, "ngo_cost": 10, "shipping": 10, **(price_extra or {})})
    assert p.status_code == 201, p.text
    return p.json(), ngo, admin


CHECK = {"craft_claim": True, "evidence": True, "price": True, "consent": True}


def test_verify_all_states(client):
    assert client.get(f"/api/verify/{token_of('prod_s1')}").json()["state"] == "VERIFIED"
    assert client.get(f"/api/verify/{token_of('prod_s7')}").json()["state"] == "PENDING"
    assert client.get(f"/api/verify/{token_of('prod_s6')}").json()["state"] == "REVOKED"
    t = token_of("prod_s1")
    bad_char = "A" if t[-1] != "A" else "B"
    assert client.get(f"/api/verify/{t[:-1]}{bad_char}").json()["state"] == "NOT_FOUND"  # tampered signature
    assert client.get("/api/verify/not-a-real-code").json()["state"] == "NOT_FOUND"
    v = client.get(f"/api/verify/{t}").json()
    assert v["message"] == "Traced to a verified artisan and NGO."


def test_consent_filter_hides_unconsented(client):
    ids = {a["id"] for a in client.get("/api/artisans").json()}
    assert "art_s5" not in ids and "art_s1" in ids
    assert client.get("/api/artisans/art_s5").status_code == 404
    pids = {p["id"] for p in client.get("/api/products").json()}
    assert "prod_s1" in pids and not ({"prod_s6", "prod_s7", "prod_s8"} & pids)
    assert client.get("/api/products/prod_s7").status_code == 404
    assert client.get("/api/vault/designs/des_s3").status_code == 404  # consent pending
    assert "des_s3" not in {d["id"] for d in client.get("/api/vault/designs").json()}


def test_price_calc(client):
    r = client.post("/api/price/calc", json={"materials": 300, "hours": 10, "rate": 80, "ngo": 100, "shipping": 120, "fee": 66})
    assert r.status_code == 200 and r.json()["total"] == 1386 and r.json()["artisan_share"] == 1100
    assert client.post("/api/price/calc", json={"materials": -1, "hours": 1, "rate": 1, "ngo": 1, "shipping": 1, "fee": 1}).status_code == 422


def test_login_and_permissions(client):
    assert client.post("/api/auth/login", json={"username": "admin", "password": "wrong"}).status_code == 401
    assert client.get("/api/admin/queue").status_code == 401
    ngo, admin = login(client, "ngo_one"), login(client, "admin")
    assert client.get("/api/admin/queue", headers=ngo).status_code == 403
    assert client.get("/api/ngo/payouts", headers=admin).status_code == 403
    assert client.get("/api/admin/queue", headers=admin).status_code == 200
    # NGO isolation
    two = login(client, "ngo_two")
    other = client.get("/api/ngo/payouts", headers=two).json()
    mine = client.get("/api/ngo/payouts", headers=ngo).json()
    assert not ({p["id"] for p in other} & {p["id"] for p in mine})
    assert client.patch(f"/api/ngo/payouts/{other[0]['id']}", headers=ngo, json={"status": "READY"}).status_code == 404
    assert client.post("/api/ngo/products", headers=ngo, json={
        "artisan_id": "art_s3", "craft_id": "craft_dokra", "title": "x", "materials": 1, "hours": 1, "rate": 1,
        "ngo_cost": 0, "shipping": 0}).status_code == 404  # art_s3 belongs to ngo_two


def test_full_flow_and_immediate_revoke(client):
    p, ngo, admin = new_verified_product(client)
    assert p["status"] == "PENDING" and p["platform_fee"] == 11  # server-computed 5%
    assert client.get(f"/api/verify/{p['qr_token']}").json()["state"] == "PENDING"
    assert client.get(f"/api/products/{p['id']}").status_code == 404  # not public until approved
    assert client.post(f"/api/admin/approve/{p['id']}", headers=admin, json={"type": "product"}).status_code == 422
    assert client.post(f"/api/admin/approve/{p['id']}", headers=admin, json={"type": "product", "checklist": {**CHECK, "price": False}}).status_code == 422
    assert client.post(f"/api/admin/approve/{p['id']}", headers=admin, json={"type": "product", "checklist": CHECK}).status_code == 200
    assert client.get(f"/api/verify/{p['qr_token']}").json()["state"] == "VERIFIED"

    o = client.post("/api/orders", json={"product_id": p["id"], "quantity": 2}).json()
    assert o["total"] == 462 and o["status"] == "PLACED"
    assert client.get(f"/api/orders/{o['id']}").json()["id"] == o["id"]
    led = [x for x in client.get("/api/ngo/payouts", headers=ngo).json() if x["order_id"] == o["id"]][0]
    assert led["amount"] == 400 and led["status"] == "PENDING"

    assert client.patch(f"/api/orders/{o['id']}/status", headers=ngo, json={"status": "SHIPPED"}).status_code == 409  # no skipping
    for s in ["NGO_CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"]:
        assert client.patch(f"/api/orders/{o['id']}/status", headers=ngo, json={"status": s}).status_code == 200
    assert client.patch(f"/api/orders/{o['id']}/status", headers=ngo, json={"status": "DELIVERED"}).status_code == 200  # idempotent
    assert client.patch(f"/api/orders/{o['id']}/status", headers=login(client, "ngo_two"), json={"status": "PLACED"}).status_code == 404

    led = [x for x in client.get("/api/ngo/payouts", headers=ngo).json() if x["id"] == led["id"]][0]
    assert led["status"] == "READY"
    url = f"/api/ngo/payouts/{led['id']}"
    assert client.patch(url, headers=ngo, json={"status": "PAID"}).status_code == 422  # needs a reference
    assert client.patch(url, headers=ngo, json={"status": "PAID", "bank_reference": "bad ref!"}).status_code == 422
    assert client.patch(url, headers=ngo, json={"status": "PAID", "bank_reference": "SBX-1001"}).status_code == 200
    assert client.patch(url, headers=ngo, json={"status": "PAID", "bank_reference": "SBX-1001"}).status_code == 200  # idempotent
    assert client.patch(url, headers=ngo, json={"status": "PENDING"}).status_code == 409

    # revoke: the very next scan reflects it
    assert client.post(f"/api/admin/revoke/{p['id']}", headers=admin, json={"type": "product", "reason": "Test revoke"}).status_code == 200
    assert client.get(f"/api/verify/{p['qr_token']}").json()["state"] == "REVOKED"
    assert client.post("/api/orders", json={"product_id": p["id"]}).status_code == 404
    actions = [r["action"] for r in client.get("/api/admin/audit?limit=200", headers=admin).json()]
    assert "product_revoked" in actions and "product_approved" in actions
    assert client.get("/api/admin/audit/verify", headers=admin).json()["ok"] is True


def test_revoking_artisan_or_ngo_revokes_verify(client):
    p, ngo, admin = new_verified_product(client)
    client.post(f"/api/admin/approve/{p['id']}", headers=admin, json={"type": "product", "checklist": CHECK})
    assert client.get(f"/api/verify/{p['qr_token']}").json()["state"] == "VERIFIED"
    client.post(f"/api/admin/revoke/{p['artisan_id']}", headers=admin, json={"type": "artisan", "reason": "Test suspend"})
    assert client.get(f"/api/verify/{p['qr_token']}").json()["state"] == "REVOKED"


def test_below_minimum_needs_admin_reason(client):
    p, ngo, admin = new_verified_product(client, {"listed_price": 220})  # total 231, artisan share 200
    assert p["price_review"] == "PENDING"
    q = client.get("/api/admin/queue", headers=admin).json()
    assert p["id"] in [x["product_id"] for x in q["price_reviews"]]
    body = {"type": "product", "checklist": CHECK}
    assert client.post(f"/api/admin/approve/{p['id']}", headers=admin, json=body).status_code == 422
    assert client.post(f"/api/admin/approve/{p['id']}", headers=admin, json={**body, "reason": "short"}).status_code == 422
    assert client.post(f"/api/admin/approve/{p['id']}", headers=admin, json={**body, "reason": "Fair-trade fair discount agreed with artisan"}).status_code == 200
    assert client.get(f"/api/products/{p['id']}").json()["price"]["charged_total"] == 220
    entries = client.get("/api/admin/audit?limit=50", headers=admin).json()
    assert "price_override_approved" in [e["action"] for e in entries]


def test_listing_below_artisan_share_or_above_total_rejected(client):
    ngo = login(client, "ngo_one")
    base = {"artisan_id": "art_s1", "craft_id": "craft_warli", "title": "x", "materials": 100, "hours": 1, "rate": 100, "ngo_cost": 10, "shipping": 10}
    assert client.post("/api/ngo/products", headers=ngo, json={**base, "listed_price": 150}).status_code == 422
    assert client.post("/api/ngo/products", headers=ngo, json={**base, "listed_price": 500}).status_code == 422


def test_payment_callback_is_signed_and_idempotent(client):
    o = client.post("/api/orders", json={"product_id": "prod_s1"}).json()
    body = json.dumps({"idempotency_key": "key-12345678", "order_id": o["id"], "status": "SUCCESS"}).encode()
    sig = hmac.new(b"test-pay-secret-0123456789", body, hashlib.sha256).hexdigest()
    h = {"X-Signature": sig, "Content-Type": "application/json"}
    assert client.post("/api/payments/callback", content=body, headers={"X-Signature": "bad"}).status_code == 401
    first = client.post("/api/payments/callback", content=body, headers=h).json()
    again = client.post("/api/payments/callback", content=body, headers=h).json()
    assert first["duplicate"] is False and again["duplicate"] is True
    assert client.get(f"/api/orders/{o['id']}").json()["payment_status"] == "PAID_SANDBOX"


def test_verify_rate_limited(client):
    t = token_of("prod_s1")
    codes = [client.get(f"/api/verify/{t}").status_code for _ in range(35)]
    assert codes[0] == 200 and codes[-1] == 429


def test_scan_alerts_flag_busy_tokens(client):
    from app.db import SessionLocal
    from app.models import ScanLog
    from app.audit import now_iso
    with SessionLocal() as db:
        db.add_all([ScanLog(product_id="prod_s5", token_hash="h", scanned_at=now_iso()) for _ in range(25)])
        db.commit()
    alerts = client.get("/api/admin/scan-alerts", headers=login(client, "admin")).json()
    assert "prod_s5" in [a["product_id"] for a in alerts]


def test_audit_log_is_append_only(client):
    from app.db import SessionLocal
    with SessionLocal() as db:
        with pytest.raises(Exception):
            db.execute(text("UPDATE audit_log SET actor='evil'"))
            db.commit()
    with SessionLocal() as db:
        with pytest.raises(Exception):
            db.execute(text("DELETE FROM audit_log"))
            db.commit()


def test_design_vault_flow(client):
    one, two = login(client, "ngo_one"), login(client, "ngo_two")
    h = hashlib.sha256(b"sample design file").hexdigest()
    body = {"community": "Sample community", "title": "Sample test design", "meaning": "Invented.", "file_hash": h,
            "consent_status": "consented", "licence_policy": "COMMERCIAL", "visibility": "public"}
    d = client.post("/api/vault/designs", headers=one, json=body)
    assert d.status_code == 201 and d.json()["registered_on"]
    assert client.post("/api/vault/designs", headers=one, json=body).status_code == 409  # same hash
    assert client.post("/api/vault/designs", headers=one, json={**body, "file_hash": "xyz"}).status_code == 422
    did = d.json()["id"]
    passport = client.get(f"/api/vault/designs/{did}").json()  # public passport
    assert passport["file_hash"] == h and "does not replace" in passport["note"]

    lic = client.post("/api/vault/licences", json={"design_id": did, "requester": "Sample Buyer", "purpose": "Sample use", "quantity": 50}).json()
    assert lic["status"] == "REQUESTED"
    assert client.patch(f"/api/vault/licences/{lic['id']}", headers=two, json={"status": "APPROVED", "fee": 500}).status_code == 404
    ok = client.patch(f"/api/vault/licences/{lic['id']}", headers=one, json={"status": "APPROVED", "fee": 500})
    assert ok.status_code == 200 and ok.json()["fee"] == 500
    assert client.patch(f"/api/vault/licences/{lic['id']}", headers=one, json={"status": "APPROVED", "fee": 500}).status_code == 200  # idempotent
    assert client.patch(f"/api/vault/licences/{lic['id']}", headers=one, json={"status": "DECLINED"}).status_code == 409
    royalties = [p for p in client.get("/api/ngo/payouts", headers=one).json() if p["kind"] == "ROYALTY" and p["licence_id"] == lic["id"]]
    assert len(royalties) == 1 and royalties[0]["amount"] == 500

    # view-only design cannot be licensed
    assert client.post("/api/vault/licences", json={"design_id": "des_s2", "requester": "X", "purpose": "Sample use"}).status_code == 403
