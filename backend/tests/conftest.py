import os
import tempfile

# Environment must be set before the app is imported.
_tmp = tempfile.mkdtemp()
os.environ.update(
    TRIFAIR_QR_SECRET="test-qr-secret-0123456789",
    TRIFAIR_JWT_SECRET="test-jwt-secret-0123456789",
    TRIFAIR_PAYMENT_SECRET="test-pay-secret-0123456789",
    TRIFAIR_DB_URL=f"sqlite:///{_tmp}/test.db",
    TRIFAIR_DATA_DIR=os.path.join(os.path.dirname(__file__), "..", "..", "data"),
)
