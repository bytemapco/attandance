from pathlib import Path

from app.services.agent import registry
from app.services.agent.tools.help_tool import best_guides, guides
from app.services.agent.types import ADMIN, TEACHER

FRONTEND_PAGES = Path(__file__).resolve().parents[3] / "frontend" / "src" / "app" / "(dashboard)"


def names(role):
    return {tool.name for tool in registry.tools_for(role)}


def test_a_teacher_is_never_offered_an_admin_only_tool():
    assert names(TEACHER).isdisjoint({"institution_stats", "setup_checks", "approvals_backlog", "find_teachers",
        "create_departments", "create_subjects", "create_classrooms", "create_designations", "create_batches", "create_class",
        "set_class_semester", "add_subject_to_class", "add_schedule", "import_students", "import_teachers", "find_substitutes",
        "assign_substitute", "proxy_watch", "find_setup_items", "list_all_classes", "class_overview",
        "update_master_item", "delete_master_item", "change_batch", "update_student", "update_teacher", "change_class_students",
        "change_subject_teacher", "remove_subject_from_class", "remove_schedule_slots",
        "teacher_profile", "teacher_schedule", "institution_settings", "audit_trail", "update_institution_settings"})


def test_an_admin_can_edit_and_remove_what_they_can_create():
    assert {"create_designations", "update_master_item", "delete_master_item", "change_batch", "update_student", "update_teacher",
            "change_class_students", "change_subject_teacher", "remove_subject_from_class", "remove_schedule_slots",
            "teacher_profile", "teacher_schedule", "institution_settings", "audit_trail", "update_institution_settings"} <= names(ADMIN)


def test_an_admin_is_never_offered_a_teacher_only_tool():
    assert names(ADMIN).isdisjoint({"my_schedule", "class_register", "my_flagged_records", "my_classes", "pending_approvals",
        "start_attendance", "stop_attendance", "mark_attendance", "resolve_flagged_marks", "decide_leaves", "decide_device_changes"})


def test_both_roles_can_look_up_and_get_help():
    assert {"find_classes", "find_students", "how_do_i", "send_message", "my_notifications", "student_attendance",
            "class_attendance", "attendance_trend"} <= names(TEACHER) & names(ADMIN)


def test_only_tools_with_a_preview_write_and_they_declare_what_a_person_may_edit():
    for tool in registry.TOOLS.values():
        assert tool.writes == (tool.preview is not None)
        assert tool.editable <= set(tool.params.model_fields)
        if not tool.writes:
            assert not tool.editable


def test_every_tool_describes_itself_and_gives_the_model_a_schema():
    for tool in registry.TOOLS.values():
        assert tool.description.strip()
        assert tool.params.model_json_schema()["type"] == "object"


def test_no_tool_lets_the_model_choose_the_institution():
    for tool in registry.TOOLS.values():
        assert not {"tenant_id", "tenantId", "user_id", "role"} & set(tool.params.model_fields), tool.name


def test_a_guide_is_found_for_the_question_in_the_persons_own_role():
    assert best_guides("how do I review flagged scans", "TEACHER")[0].page == "/teacher/review"
    assert best_guides("how do I create a class", "ADMIN")[0].page == "/admin/class-management"


def test_a_teacher_never_gets_an_admin_page_and_an_admin_never_a_teacher_page():
    assert all(g.page.startswith("/teacher") for g in best_guides("set the campus location radius", "TEACHER"))
    assert all(g.page.startswith("/admin") for g in best_guides("start the class and review flagged", "ADMIN"))


def test_every_guide_points_at_a_page_that_exists():
    assert guides()
    for guide in guides():
        assert (FRONTEND_PAGES / guide.page.lstrip("/")).is_dir(), guide.page


def test_every_write_tool_is_for_exactly_one_role_and_none_can_touch_policy_or_biometrics():
    forbidden = ("config", "policy", "threshold", "face", "biometric", "password", "token", "geofence", "campus")
    for tool in registry.TOOLS.values():
        if tool.writes:
            assert len(tool.roles) == 1 or tool.name == "send_message", tool.name
        assert not any(word in tool.name for word in forbidden), tool.name
        assert not any(word in " ".join(tool.params.model_fields) for word in ("password", "token")), tool.name


def test_every_tool_has_a_plain_step_label():
    from app.services.agent.labels import LABELS

    assert set(registry.TOOLS) <= set(LABELS)
    assert all(text[0].isupper() and not text.endswith(".") for text in LABELS.values())
