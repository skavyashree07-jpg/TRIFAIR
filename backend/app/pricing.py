"""Fair-price module. Pure functions, no database, no framework.

total        = materials + hours * rate + ngo_cost + shipping + platform_fee
artisan_share = materials + hours * rate

All arithmetic uses Decimal, rounded half-up to 2 places. Never trust a price
sent by the browser: callers recompute from components with these functions.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

TWO = Decimal("0.01")
MAX_MONEY = Decimal("10000000")  # 1 crore, sanity cap
MAX_HOURS = Decimal("10000")


class PricingError(ValueError):
    """Invalid pricing input."""


def q2(value: Decimal) -> Decimal:
    return value.quantize(TWO, rounding=ROUND_HALF_UP)


def to_decimal(value, name: str, cap: Decimal = MAX_MONEY) -> Decimal:
    if isinstance(value, bool) or value is None:
        raise PricingError(f"{name} must be a number")
    try:
        d = value if isinstance(value, Decimal) else Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise PricingError(f"{name} must be a number") from None
    if not d.is_finite():
        raise PricingError(f"{name} must be a finite number")
    if d < 0:
        raise PricingError(f"{name} cannot be negative")
    if d > cap:
        raise PricingError(f"{name} is too large")
    return q2(d)


@dataclass(frozen=True)
class PriceResult:
    materials: Decimal
    labour: Decimal  # hours * rate
    ngo: Decimal
    shipping: Decimal
    fee: Decimal
    total: Decimal
    artisan_share: Decimal
    artisan_pct: Decimal

    @property
    def components(self) -> dict[str, Decimal]:
        return {
            "materials": self.materials,
            "labour": self.labour,
            "ngo": self.ngo,
            "shipping": self.shipping,
            "fee": self.fee,
        }

    def as_json(self) -> dict:
        return {
            "components": {k: float(v) for k, v in self.components.items()},
            "total": float(self.total),
            "artisan_share": float(self.artisan_share),
            "artisan_pct": float(self.artisan_pct),
        }


def calculate_price(materials, hours, rate, ngo, shipping, fee) -> PriceResult:
    m = to_decimal(materials, "materials")
    h = to_decimal(hours, "hours", MAX_HOURS)
    r = to_decimal(rate, "rate")
    n = to_decimal(ngo, "ngo")
    s = to_decimal(shipping, "shipping")
    f = to_decimal(fee, "fee")
    labour = q2(h * r)
    share = q2(m + labour)
    total = q2(share + n + s + f)
    pct = q2(share / total * 100) if total > 0 else Decimal("0.00")
    return PriceResult(m, labour, n, s, f, total, share, pct)


def minimum_price(result: PriceResult) -> Decimal:
    """The calculated minimum is the full breakdown total."""
    return result.total


def platform_fee_for(artisan_share, ngo, shipping, pct) -> Decimal:
    """Server-side platform fee: pct percent of everything except the fee."""
    base = (
        to_decimal(artisan_share, "artisan_share")
        + to_decimal(ngo, "ngo")
        + to_decimal(shipping, "shipping")
    )
    p = Decimal(str(pct))
    if p < 0 or p > 100:
        raise PricingError("fee percentage must be between 0 and 100")
    return q2(base * p / 100)


@dataclass(frozen=True)
class ListingCheck:
    effective_price: Decimal
    below_minimum: bool
    shortfall: Decimal


def check_listing(result: PriceResult, listed_price=None) -> ListingCheck:
    """Compare a requested listing price with the calculated minimum.

    - No listed price: the calculated total is used.
    - Above the total: rejected, so the public breakdown always adds up.
    - Below the total but not below the artisan share: allowed only after
      admin approval (below_minimum=True).
    - Below the artisan share: rejected outright; the artisan is never
      asked to absorb the discount.
    """
    if listed_price is None:
        return ListingCheck(result.total, False, Decimal("0.00"))
    price = to_decimal(listed_price, "listed_price")
    if price > result.total:
        raise PricingError("listed_price is above the calculated total; adjust the components instead")
    if price < result.artisan_share:
        raise PricingError("listed_price is below the artisan share and cannot be approved")
    if price < result.total:
        return ListingCheck(price, True, q2(result.total - price))
    return ListingCheck(price, False, Decimal("0.00"))
