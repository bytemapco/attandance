"""Master Seeding Pipeline Orchestrator."""

import time
from typing import Any, Dict
from app.core.logging_config import get_logger
from .client import APIClient
from .config import SeederConfig
from .data_indian import (
    CLASSROOMS,
    DEPARTMENTS,
    DESIGNATIONS,
    INSTITUTIONS,
    STUDENTS,
    SUBJECTS,
    TEACHERS,
)
from .workflow_attendance import (
    seed_device_change_workflow,
    seed_leave_request_workflow,
    setup_geofence_and_session,
)
from .workflow_auth import (
    ensure_local_superadmin_if_needed,
    login_superadmin,
    login_tenant_admin,
)
from .workflow_tenant import (
    provision_institutions,
    seed_classrooms,
    seed_departments,
    seed_designations,
    seed_subjects,
)
from .workflow_users import (
    enroll_students_in_classes,
    seed_classes,
    seed_students,
    seed_teachers,
)

logger = get_logger("app.seeder.orchestrator")


class SeederOrchestrator:
    def __init__(self, config: SeederConfig) -> None:
        self.config = config

    async def run(self) -> Dict[str, Any]:
        """Execute the multi-tier API-driven seeding pipeline."""
        start_time = time.time()
        print("\n" + "=" * 65)
        print("🌱 SMART ATTENDANCE SYSTEM — API-DRIVEN DATA SEEDER")
        print(f"• Target Environment: {self.config.env_name.upper()}")
        print(f"• Base API URL:       {self.config.api_base_url}")
        print("=" * 65 + "\n")

        # Step 0: Ensure local Super Admin exists in DB (local development only)
        await ensure_local_superadmin_if_needed(self.config)

        async with APIClient(base_url=self.config.api_base_url, timeout=self.config.request_timeout) as client:
            # Step 1: Verify API health
            health = await client.get("/health")
            print(f"[1/7] API Health Check: Status={health.get('status', 'OK')}")

            # Step 2: Authenticate Super Admin via API
            print(f"[2/7] Authenticating Super Admin ({self.config.superadmin_email})...")
            await login_superadmin(client, self.config)

            # Step 3: Provision Institutions via Super Admin API
            print("[3/7] Provisioning Institutions & Institutional Admins...")
            institutions = await provision_institutions(client, INSTITUTIONS)
            primary_tenant = institutions[0]
            tenant_id = primary_tenant["id"]
            print(f"      ✓ Configured primary institution: {primary_tenant['name']}")

            # Step 4: Authenticate as Institutional Tenant Admin
            print(f"[4/7] Authenticating as Tenant Admin ({primary_tenant['admin_email']})...")
            await login_tenant_admin(
                client,
                email=primary_tenant["admin_email"],
                password=primary_tenant["admin_password"],
                tenant_id=tenant_id,
            )

            # Step 5: Seed Master Data (Departments, Designations, Classrooms, Subjects)
            print("[5/7] Provisioning Master Data...")
            dept_map = await seed_departments(client, DEPARTMENTS)
            desig_map = await seed_designations(client, DESIGNATIONS)
            room_map = await seed_classrooms(client, CLASSROOMS)
            subject_map = await seed_subjects(client, SUBJECTS, dept_map)
            print(f"      ✓ {len(dept_map)} Depts | {len(desig_map)} Desigs | {len(room_map)} Rooms | {len(subject_map)} Subjects")

            # Step 6: Provision Faculty, Students, Academic Classes, and Enrollments
            print("[6/7] Ingesting Faculty, Students, Classes & Enrollments...")
            teacher_map = await seed_teachers(client, TEACHERS, dept_map, desig_map)
            student_map = await seed_students(client, STUDENTS, dept_map)
            class_map = await seed_classes(client, teacher_map, subject_map, room_map)
            await enroll_students_in_classes(client, class_map, student_map)
            print(f"      ✓ {len(teacher_map)} Teachers | {len(student_map)} Students | {len(class_map)} Classes")

            # Step 7: Live Workflows (Geofences, Attendance Session, Leaves, Device Changes)
            print("[7/7] Simulating Live Academic Workflows...")
            primary_class = class_map.get("CS201-DivA (Data Structures)")
            if primary_class:
                class_id = primary_class["id"]
                cse_student_ids = [
                    s["id"] for email, s in student_map.items() if s.get("branch") == "CSE" or "BCSE" in s.get("enrollment_number", "")
                ]
                await setup_geofence_and_session(
                    client,
                    teacher_email="rajesh.kulkarni@yopmail.com",
                    teacher_pass="Teacher@Secure123!",
                    class_id=class_id,
                    student_ids=cse_student_ids,
                )

            # Student Leave Request & Faculty Approval
            await seed_leave_request_workflow(
                client,
                student_email="aarav.sharma@yopmail.com",
                student_pass="Student@Secure123!",
                teacher_email="rajesh.kulkarni@yopmail.com",
                teacher_pass="Teacher@Secure123!",
            )

            # Student Hardware Device Change & Faculty Approval
            await seed_device_change_workflow(
                client,
                student_email="aarav.sharma@yopmail.com",
                student_pass="Student@Secure123!",
                teacher_email="rajesh.kulkarni@yopmail.com",
                teacher_pass="Teacher@Secure123!",
            )

        elapsed = round(time.time() - start_time, 2)
        print("\n" + "=" * 65)
        print(f"🎉 SEEDING COMPLETED SUCCESSFULLY in {elapsed}s!")
        print("• 2 Institutions (IIT Bombay, VJTI Mumbai)")
        print(f"• {len(DEPARTMENTS)} Departments & {len(DESIGNATIONS)} Designations")
        print(f"• {len(CLASSROOMS)} Classrooms & {len(SUBJECTS)} Subjects")
        print(f"• {len(TEACHERS)} Faculty members & {len(STUDENTS)} Enrolled students")
        print("• Live Attendance Session with Roster Attendance Marked")
        print("• Completed Leave & Device Change Approval Cycles")
        print("=" * 65 + "\n")

        return {
            "status": "success",
            "elapsed_seconds": elapsed,
            "tenant_id": tenant_id,
        }
