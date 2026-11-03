from typing import Optional

# The placeholder institution local development falls back to when a request names none.
DEFAULT_TENANT_IDENTIFIER = "default-institution"


def is_real_tenant(tenant_id: Optional[str]) -> bool:
    """True for an actual institution id, False for no tenant or the development placeholder."""
    return bool(tenant_id) and tenant_id != DEFAULT_TENANT_IDENTIFIER
