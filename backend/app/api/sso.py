from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status

from app.services.sso_service import SSOService

router = APIRouter(prefix="/auth/sso", tags=["Authentication"])


@router.get("/config")
async def get_sso_config(tenant_slug: str) -> Dict[str, Any]:
    try:
        return await SSOService.get_tenant_sso_config(tenant_slug)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@router.post("/saml/acs", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def saml_assertion_consumer() -> None:
    """Signed-in sessions must never come from an assertion that nobody verified.

    The endpoint used to trust any XML posted to it and issue a token for the e-mail inside, including
    super admin accounts. It stays closed until assertions are checked against the tenant's IdP certificate.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="SAML sign-in is not available: assertion signatures are not verified yet.",
    )
