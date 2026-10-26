"""SQLAlchemy models. Field names match the shared data shapes exactly.

Additions beyond the shared brief (flagged for the team):
  NGO (new shape), User, AuditLog, ScanLog, PaymentEvent,
  Product.listed_price / price_review / price_reason,
  Order.quantity / artisan_share / buyer_label / payment_status,
  PayoutLedger.ngo_id / licence_id / kind (order_id and artisan_id nullable),
  Artisan.status, Design.ngo_id, Licence.created_at / decided_by / decided_on.
"""
from __future__ import annotations

from decimal import Decimal

from sqlalchemy import (
    DDL, JSON, BigInteger, Boolean, ForeignKey, Integer, String, Text, event,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import TypeDecorator

from .db import Base


class Money(TypeDecorator):
    """Decimal with 2 places, stored as integer hundredths (no float rounding)."""

    impl = BigInteger
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return int((Decimal(str(value)) * 100).to_integral_value())

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return Decimal(value) / 100


class Craft(Base):
    __tablename__ = "crafts"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    tribe: Mapped[str] = mapped_column(String(120))
    region: Mapped[str] = mapped_column(String(120))
    history: Mapped[str] = mapped_column(Text)
    steps: Mapped[list] = mapped_column(JSON, default=list)
    symbols: Mapped[list] = mapped_column(JSON, default=list)
    gi_status: Mapped[dict] = mapped_column(JSON)  # {status, registry_url, verified_on}
    consent_status: Mapped[str] = mapped_column(String(20), default="pending")
    reviewed_on: Mapped[str | None] = mapped_column(String(10), nullable=True)
    sample: Mapped[bool] = mapped_column(Boolean, default=True)


class NGO(Base):
    __tablename__ = "ngos"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    region: Mapped[str] = mapped_column(String(120))
    consent_status: Mapped[str] = mapped_column(String(20), default="pending")
    status: Mapped[str] = mapped_column(String(20), default="PENDING")  # PENDING|ACTIVE|SUSPENDED|REVOKED
    verified_on: Mapped[str | None] = mapped_column(String(10), nullable=True)
    sample: Mapped[bool] = mapped_column(Boolean, default=True)


class Artisan(Base):
    __tablename__ = "artisans"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    ngo_id: Mapped[str] = mapped_column(ForeignKey("ngos.id"))
    display_name: Mapped[str] = mapped_column(String(120))
    village: Mapped[str] = mapped_column(String(120))  # village name only, no precise location
    craft_id: Mapped[str] = mapped_column(ForeignKey("crafts.id"))
    story: Mapped[str] = mapped_column(Text, default="")
    consent_status: Mapped[str] = mapped_column(String(20), default="pending")
    endorsed_by: Mapped[str | None] = mapped_column(String(160), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")  # ACTIVE|SUSPENDED
    sample: Mapped[bool] = mapped_column(Boolean, default=True)


class Product(Base):
    __tablename__ = "products"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    artisan_id: Mapped[str] = mapped_column(ForeignKey("artisans.id"))
    craft_id: Mapped[str] = mapped_column(ForeignKey("crafts.id"))
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    images: Mapped[list] = mapped_column(JSON, default=list)
    materials: Mapped[Decimal] = mapped_column(Money)
    hours: Mapped[Decimal] = mapped_column(Money)
    rate: Mapped[Decimal] = mapped_column(Money)
    ngo_cost: Mapped[Decimal] = mapped_column(Money)
    shipping: Mapped[Decimal] = mapped_column(Money)
    platform_fee: Mapped[Decimal] = mapped_column(Money)
    listed_price: Mapped[Decimal | None] = mapped_column(Money, nullable=True)
    price_review: Mapped[str] = mapped_column(String(10), default="NONE")  # NONE|PENDING|APPROVED
    price_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    qr_token: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(10), default="PENDING")  # PENDING|VERIFIED|REVOKED
    labels: Mapped[list] = mapped_column(JSON, default=list)
    verified_by: Mapped[str | None] = mapped_column(String(80), nullable=True)
    verified_on: Mapped[str | None] = mapped_column(String(10), nullable=True)
    sample: Mapped[bool] = mapped_column(Boolean, default=True)


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    total: Mapped[Decimal] = mapped_column(Money)
    artisan_share: Mapped[Decimal] = mapped_column(Money)
    buyer_label: Mapped[str | None] = mapped_column(String(60), nullable=True)  # no real contact data
    status: Mapped[str] = mapped_column(String(20), default="PLACED")
    payment_status: Mapped[str] = mapped_column(String(20), default="UNPAID")  # UNPAID|PAID_SANDBOX|FAILED
    created_at: Mapped[str] = mapped_column(String(32))
    sample: Mapped[bool] = mapped_column(Boolean, default=True)


class PayoutLedger(Base):
    __tablename__ = "payout_ledger"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    ngo_id: Mapped[str] = mapped_column(ForeignKey("ngos.id"))
    artisan_id: Mapped[str | None] = mapped_column(ForeignKey("artisans.id"), nullable=True)
    order_id: Mapped[str | None] = mapped_column(ForeignKey("orders.id"), nullable=True)
    licence_id: Mapped[str | None] = mapped_column(ForeignKey("licences.id"), nullable=True)
    kind: Mapped[str] = mapped_column(String(10), default="SALE")  # SALE|ROYALTY
    amount: Mapped[Decimal] = mapped_column(Money)
    status: Mapped[str] = mapped_column(String(10), default="PENDING")  # PENDING|READY|PAID
    bank_reference: Mapped[str | None] = mapped_column(String(60), nullable=True)  # a reference only
    paid_on: Mapped[str | None] = mapped_column(String(10), nullable=True)
    sample: Mapped[bool] = mapped_column(Boolean, default=True)


class Design(Base):
    __tablename__ = "designs"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    ngo_id: Mapped[str] = mapped_column(ForeignKey("ngos.id"))
    community: Mapped[str] = mapped_column(String(160))
    title: Mapped[str] = mapped_column(String(160))
    meaning: Mapped[str] = mapped_column(Text)
    file_hash: Mapped[str] = mapped_column(String(64), unique=True)
    registered_on: Mapped[str] = mapped_column(String(10))
    consent_status: Mapped[str] = mapped_column(String(20), default="pending")
    licence_policy: Mapped[str] = mapped_column(String(20), default="NOT_AVAILABLE")
    visibility: Mapped[str] = mapped_column(String(10), default="public")  # public|view_only|private
    sample: Mapped[bool] = mapped_column(Boolean, default=True)


class Licence(Base):
    __tablename__ = "licences"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    design_id: Mapped[str] = mapped_column(ForeignKey("designs.id"))
    requester: Mapped[str] = mapped_column(String(120))
    purpose: Mapped[str] = mapped_column(Text)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(12), default="REQUESTED")
    fee: Mapped[Decimal | None] = mapped_column(Money, nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))
    decided_by: Mapped[str | None] = mapped_column(String(80), nullable=True)
    decided_on: Mapped[str | None] = mapped_column(String(10), nullable=True)
    sample: Mapped[bool] = mapped_column(Boolean, default=True)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(10))  # admin|ngo
    ngo_id: Mapped[str | None] = mapped_column(ForeignKey("ngos.id"), nullable=True)


class AuditLog(Base):
    """Append-only. UPDATE and DELETE are blocked by ORM hooks and SQLite triggers."""

    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ts: Mapped[str] = mapped_column(String(32))
    actor: Mapped[str] = mapped_column(String(80))
    actor_role: Mapped[str] = mapped_column(String(10))
    action: Mapped[str] = mapped_column(String(60))
    target_type: Mapped[str] = mapped_column(String(30))
    target_id: Mapped[str] = mapped_column(String(60))
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON text
    prev_hash: Mapped[str] = mapped_column(String(64))
    hash: Mapped[str] = mapped_column(String(64))


class ScanLog(Base):
    """Time and token hash only. No IP address or personal data."""

    __tablename__ = "scan_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    token_hash: Mapped[str] = mapped_column(String(64))
    scanned_at: Mapped[str] = mapped_column(String(32), index=True)


class PaymentEvent(Base):
    __tablename__ = "payment_events"
    idempotency_key: Mapped[str] = mapped_column(String(80), primary_key=True)
    order_id: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(10))
    processed_at: Mapped[str] = mapped_column(String(32))


# ---- append-only enforcement for the audit log --------------------------------
for _op in ("UPDATE", "DELETE"):
    event.listen(
        AuditLog.__table__,
        "after_create",
        DDL(
            f"CREATE TRIGGER IF NOT EXISTS audit_log_no_{_op.lower()} BEFORE {_op} ON audit_log "
            "BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;"
        ).execute_if(dialect="sqlite"),
    )


@event.listens_for(AuditLog, "before_update")
@event.listens_for(AuditLog, "before_delete")
def _audit_immutable(mapper, connection, target):
    raise RuntimeError("audit_log is append-only")
