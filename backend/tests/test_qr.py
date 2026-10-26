from app import qr

S = "unit-test-secret-0123456789"


def test_roundtrip_and_uniqueness():
    a, b = qr.generate_token(S), qr.generate_token(S)
    assert a != b and qr.has_valid_signature(a, S)


def test_wrong_secret_fails():
    assert not qr.has_valid_signature(qr.generate_token(S), "another-secret-0123456789")


def test_tampering_fails():
    t = qr.generate_token(S)
    raw, sig = t.split(".")
    flipped = ("A" if raw[0] != "A" else "B") + raw[1:]
    assert not qr.has_valid_signature(f"{flipped}.{sig}", S)
    assert not qr.has_valid_signature(f"{raw}.{'A' * 22}", S)


def test_malformed_inputs():
    for bad in ["", "abc", "a.b", "x" * 500, "../../etc/passwd", None, "a" * 20 + "." + "b" * 21]:
        assert not qr.has_valid_signature(bad, S)


def test_hash_is_stable_and_not_the_token():
    t = qr.generate_token(S)
    assert qr.token_hash(t) == qr.token_hash(t) and t not in qr.token_hash(t)
