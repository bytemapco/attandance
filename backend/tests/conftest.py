import os
import sys
from pathlib import Path

import pytest

# Set before anything imports `app`: the settings and the Prisma client read these once, at import time.
# A real environment variable wins over backend/.env, so a developer's own database and Redis are never used.
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production-use-0123456789")
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL") or "postgresql://test:test@localhost:5432/test"
os.environ["REDIS_URL"] = os.environ.get("TEST_REDIS_URL") or "redis://127.0.0.1:1/0"
os.environ["ENVIRONMENT"] = "test"

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def pytest_collection_modifyitems(items):
    for item in items:
        parts = Path(str(item.fspath)).parts
        if "integration" in parts:
            item.add_marker(pytest.mark.integration)
        elif "unit" in parts:
            item.add_marker(pytest.mark.unit)
