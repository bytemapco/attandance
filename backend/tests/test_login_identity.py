from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.services import login_identity


def user(user_id: str, password: str):
    return SimpleNamespace(id=user_id, hashedPassword=password)


@pytest.fixture
def fake_db(monkeypatch):
    fake = MagicMock()
    fake.student.find_many = AsyncMock(return_value=[])
    fake.teacher.find_many = AsyncMock(return_value=[])
    monkeypatch.setattr(login_identity, "db", fake)
    monkeypatch.setattr(login_identity, "verify_password", lambda plain, hashed: plain == hashed)
    return fake


def stub_email_lookup(monkeypatch, found):
    repo = MagicMock()
    repo.get_by_email = AsyncMock(return_value=found)
    monkeypatch.setattr(login_identity, "UserRepository", lambda: repo)
    return repo


async def test_email_never_touches_student_or_teacher_tables(fake_db, monkeypatch):
    repo = stub_email_lookup(monkeypatch, user("u1", "pw"))

    result = await login_identity.find_candidate_users("Asha@College.in")

    assert [u.id for u in result] == ["u1"]
    repo.get_by_email.assert_awaited_once_with("asha@college.in")
    fake_db.student.find_many.assert_not_awaited()


async def test_same_roll_number_in_two_institutions_returns_both_accounts(fake_db):
    fake_db.student.find_many.return_value = [
        SimpleNamespace(user=user("u-a", "pw-a")),
        SimpleNamespace(user=user("u-b", "pw-b")),
    ]

    result = await login_identity.find_candidate_users("001")

    assert {u.id for u in result} == {"u-a", "u-b"}


async def test_institution_code_narrows_the_search_to_that_tenant(fake_db):
    await login_identity.find_candidate_users("001", tenant_slug="college-a")

    where = fake_db.student.find_many.await_args.kwargs["where"]
    assert where == {"enrollmentNumber": "001", "tenant": {"is": {"slug": "college-a"}}}
    teacher_where = fake_db.teacher.find_many.await_args.kwargs["where"]
    assert teacher_where["tenant"] == {"is": {"slug": "college-a"}}


async def test_unknown_id_with_an_institution_code_does_not_fall_back_to_email(fake_db, monkeypatch):
    repo = stub_email_lookup(monkeypatch, user("u1", "pw"))

    assert await login_identity.find_candidate_users("001", tenant_slug="college-a") == []
    repo.get_by_email.assert_not_awaited()


def test_password_picks_the_right_account_when_an_id_is_shared(fake_db):
    candidates = [user("u-a", "pw-a"), user("u-b", "pw-b")]

    assert login_identity.pick_user_by_password(candidates, "pw-b").id == "u-b"


def test_wrong_password_matches_nobody(fake_db):
    assert login_identity.pick_user_by_password([user("u-a", "pw-a")], "nope") is None


def test_two_accounts_with_the_same_password_asks_for_the_institution_code(fake_db):
    with pytest.raises(HTTPException) as caught:
        login_identity.pick_user_by_password([user("u-a", "same"), user("u-b", "same")], "same")

    assert caught.value.status_code == 409
    assert "institution code" in caught.value.detail
