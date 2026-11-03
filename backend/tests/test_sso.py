import base64

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import sso

app = FastAPI()
app.include_router(sso.router)

FORGED_ASSERTION = base64.b64encode(
    b"<Response><Assertion><Subject><NameID>superadmin@attendance.system</NameID></Subject></Assertion></Response>"
).decode()


def test_unsigned_saml_assertion_never_signs_anyone_in():
    response = TestClient(app).post("/auth/sso/saml/acs", data={"SAMLResponse": FORGED_ASSERTION})
    assert response.status_code == 501
    assert "access_token" not in response.text
