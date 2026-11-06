from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.services.agent import access
from app.services.agent.types import ADMIN, TEACHER


def user(role, tenant="tenant-1"):
    return SimpleNamespace(id="user-1", role=role, tenantId=tenant)


@pytest.fixture
def parts(monkeypatch):
    tenant = SimpleNamespace(id="tenant-1", settings={})
    fake_db = MagicMock()
    fake_db.tenant.find_unique = AsyncMock(return_value=tenant)
    fake_db.tenant.update = AsyncMock()
    teachers = MagicMock()
    teachers.get_by_user_id = AsyncMock(return_value=SimpleNamespace(id="teacher-1"))
    monkeypatch.setattr(access, "db", fake_db)
    monkeypatch.setattr(access, "TeacherRepository", lambda: teachers)
    monkeypatch.setattr(access.settings, "GEMINI_API_KEY", "key")
    return SimpleNamespace(db=fake_db, tenant=tenant, teachers=teachers)


async def refused(call, code):
    with pytest.raises(HTTPException) as caught:
        await call
    assert caught.value.status_code == code
    return caught.value.detail


class TestBuildPrincipal:
    @pytest.mark.parametrize("role", ["STUDENT", "SUPER_ADMIN"])
    async def test_students_and_the_platform_admin_have_no_assistant(self, parts, role):
        await refused(access.build_principal(user(role)), 403)

    @pytest.mark.parametrize("role", ["ADMIN", "TENANT_ADMIN"])
    async def test_both_admin_roles_become_one_admin_principal(self, parts, role):
        principal = await access.build_principal(user(role))
        assert (principal.role, principal.tenant_id, principal.teacher) == (ADMIN, "tenant-1", None)

    async def test_a_teacher_carries_their_profile(self, parts):
        principal = await access.build_principal(user("TEACHER"))
        assert principal.role == TEACHER and principal.teacher.id == "teacher-1"

    async def test_a_teacher_without_a_profile_is_not_found(self, parts):
        parts.teachers.get_by_user_id.return_value = None
        await refused(access.build_principal(user("TEACHER")), 404)

    async def test_an_account_without_an_institution_is_refused(self, parts):
        await refused(access.build_principal(user("TEACHER", tenant=None)), 403)


class TestReady:
    async def principal(self):
        return await access.build_principal(user("TENANT_ADMIN"))

    async def test_no_model_key_means_not_set_up(self, parts, monkeypatch):
        monkeypatch.setattr(access.settings, "GEMINI_API_KEY", "")
        await refused(access.require_ready(await self.principal()), 503)

    async def test_the_notice_must_be_accepted_first(self, parts):
        assert await refused(access.require_ready(await self.principal()), 403) == access.NOTICE_REQUIRED

    async def test_an_accepted_notice_lets_the_assistant_run(self, parts):
        parts.tenant.settings = {"aiAssistant": {"acceptedAt": "2026-11-06T00:00:00+00:00"}}
        await access.require_ready(await self.principal())

    async def test_a_notice_without_a_date_does_not_count(self, parts):
        parts.tenant.settings = {"aiAssistant": {}}
        await refused(access.require_ready(await self.principal()), 403)


class TestAcceptNotice:
    async def test_a_teacher_cannot_accept_for_the_institution(self, parts):
        teacher = await access.build_principal(user("TEACHER"))
        await refused(access.accept_notice(teacher), 403)
        parts.db.tenant.update.assert_not_awaited()

    async def test_an_admin_records_who_and_when_and_keeps_other_settings(self, parts):
        parts.tenant.settings = {"setupCompletedAt": "earlier"}
        admin = await access.build_principal(user("ADMIN"))

        await access.accept_notice(admin)

        saved = parts.db.tenant.update.call_args.kwargs["data"]["settings"].data
        assert saved["setupCompletedAt"] == "earlier"
        assert saved["aiAssistant"]["acceptedBy"] == "user-1" and saved["aiAssistant"]["acceptedAt"]


async def test_status_tells_each_role_whether_it_may_accept(parts):
    parts.tenant.settings = {"aiAssistant": {"acceptedAt": "x"}}
    admin = await access.assistant_status(await access.build_principal(user("ADMIN")))
    teacher = await access.assistant_status(await access.build_principal(user("TEACHER")))
    assert (admin["can_accept_notice"], teacher["can_accept_notice"]) == (True, False)
    assert admin["notice_accepted"] and admin["model_configured"]
