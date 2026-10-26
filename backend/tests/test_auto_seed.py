from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import main
from app.db import Base
from app.models import Product


def test_auto_seed_is_opt_in_and_idempotent(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    isolated_sessions = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    monkeypatch.setattr(main, "SessionLocal", isolated_sessions)
    monkeypatch.setenv("TRIFAIR_DEMO_PASSWORD", "test-auto-seed-password")

    monkeypatch.setenv("TRIFAIR_AUTO_SEED", "false")
    main.seed_demo_database_if_empty()
    with isolated_sessions() as db:
        assert db.scalar(select(Product.id).limit(1)) is None

    monkeypatch.setenv("TRIFAIR_AUTO_SEED", "true")
    main.seed_demo_database_if_empty()
    main.seed_demo_database_if_empty()
    with isolated_sessions() as db:
        assert db.query(Product).count() == 9
    engine.dispose()
