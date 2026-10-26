from decimal import Decimal

import pytest

from app.pricing import PricingError, calculate_price, check_listing, platform_fee_for


def test_formula_and_share():
    r = calculate_price(300, 10, 80, 100, 120, 66)
    assert r.total == Decimal("1386.00")
    assert r.artisan_share == Decimal("1100.00")
    assert r.artisan_pct == Decimal("79.37")
    assert r.components["labour"] == Decimal("800.00")


def test_components_sum_to_total():
    r = calculate_price("12.34", "2.5", "45.67", "3.21", "4.5", "1.1")
    assert sum(r.components.values()) == r.total


def test_zero_total_has_zero_pct():
    assert calculate_price(0, 0, 0, 0, 0, 0).artisan_pct == Decimal("0.00")


def test_decimal_rounding_half_up():
    assert calculate_price("0.005", 0, 0, 0, 0, 0).total == Decimal("0.01")


@pytest.mark.parametrize("bad", [-1, "abc", None, True, float("nan"), float("inf"), 10**9])
def test_rejects_invalid(bad):
    with pytest.raises(PricingError):
        calculate_price(bad, 1, 1, 1, 1, 1)


def test_hours_cap():
    with pytest.raises(PricingError):
        calculate_price(1, 10**6, 1, 1, 1, 1)


def test_platform_fee():
    assert platform_fee_for(1100, 100, 120, 5) == Decimal("66.00")
    with pytest.raises(PricingError):
        platform_fee_for(1, 1, 1, 101)


def test_listing_checks():
    r = calculate_price(300, 10, 80, 100, 120, 66)  # total 1386, share 1100
    assert not check_listing(r).below_minimum
    assert not check_listing(r, 1386).below_minimum
    low = check_listing(r, 1200)
    assert low.below_minimum and low.shortfall == Decimal("186.00") and low.effective_price == Decimal("1200.00")
    with pytest.raises(PricingError):
        check_listing(r, 1000)  # below the artisan share
    with pytest.raises(PricingError):
        check_listing(r, 1500)  # above the breakdown
