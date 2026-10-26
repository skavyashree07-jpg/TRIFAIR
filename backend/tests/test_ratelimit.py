from app.ratelimit import SlidingWindowLimiter


def test_limit_and_window_reset():
    t = [0.0]
    lim = SlidingWindowLimiter(3, 60, clock=lambda: t[0])
    assert [lim.allow("a") for _ in range(4)] == [True, True, True, False]
    assert lim.allow("b")  # separate key
    t[0] = 61
    assert lim.allow("a")
