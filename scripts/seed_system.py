#!/usr/bin/env python3
import asyncio
import json
import time
from scripts.seed.client import ApiClient
from scripts.seed.config import parse_args
from scripts.seed.data_generator import INSTITUTIONS
from scripts.seed.workflows import admin, student, super_admin, teacher


async def run_seeder() -> None:
    config = parse_args()
    print("=" * 64)
    print("🚀 SMART ATTENDANCE SYSTEM — PRODUCTION API SEEDER")
    print(f"• Target Environment: {config.env.upper()}")
    print(f"• API Base URL:       {config.base_url}")
    print(f"• Scale Profile:      {config.scale.upper()}")
    print("=" * 64)

    client = ApiClient(base_url=config.base_url)
    start_time = time.time()
    credentials_export: dict = {"environment": config.env, "tenants": []}

    try:
        health = await client.get("/health")
        print(f"✅ Backend API verified online: status='{health.get('status')}'")

        await super_admin.login_super_admin(client, config.superadmin_email, config.superadmin_password)
        target_institutions = INSTITUTIONS[: config.profile.tenants]
        tenants = await super_admin.setup_tenants(client, target_institutions)

        for tenant_info in tenants:
            t_id = tenant_info["id"]
            t_slug = tenant_info["slug"]
            print(f"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print(f"🏛️ Processing Tenant: {tenant_info['name']} ({t_slug})")
            print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

            admin_token = await admin.login_tenant_admin(
                client, tenant_info["admin_email"], tenant_info["admin_password"], t_id
            )
            master_data = await admin.setup_master_data(client, t_id)

            teachers, students = await admin.provision_faculty_and_students(
                client, t_slug, master_data, config.profile.teachers_per_tenant, config.profile.students_per_tenant
            )

            classes = await admin.setup_classes_and_enrollments(
                client, config.profile.classes_per_tenant, teachers, students, master_data
            )

            print(f"\n    [Sessions] Running live classroom sessions & simulated check-ins...")
            session_count = 0
            teacher_tokens: dict[str, str] = {}
            student_tokens: dict[str, str] = {}

            async def get_teacher_token(t_info: dict) -> str:
                email = t_info["email"]
                if email not in teacher_tokens:
                    teacher_tokens[email] = await teacher.login_teacher(
                        client, email, t_info["password"], t_id
                    )
                else:
                    client.set_auth(token=teacher_tokens[email], tenant_id=t_id)
                return teacher_tokens[email]

            async def get_student_token(s_info: dict) -> str | None:
                email = s_info["email"]
                if email not in student_tokens:
                    dev_uuid = f"DEV-{s_info['enrollment_number']}"
                    tok = await student.login_student(
                        client, email, s_info["password"], dev_uuid, t_id
                    )
                    if tok:
                        student_tokens[email] = tok
                else:
                    client.set_auth(token=student_tokens[email], tenant_id=t_id)
                return student_tokens.get(email)

            for teacher_info in teachers:
                if session_count >= config.profile.classes_per_tenant:
                    break
                await get_teacher_token(teacher_info)
                my_classes = await client.get("/teacher/my-classes")
                if not my_classes:
                    continue

                for cls in my_classes:
                    if session_count >= config.profile.classes_per_tenant:
                        break
                    class_id = cls["id"]
                    await teacher.configure_geofence(client, class_id, tenant_info["lat"], tenant_info["lon"])

                    session_id = await teacher.start_class_session(client, class_id)
                    session_count += 1

                    # Pick students to simulate check-in
                    class_students = students[: min(12, len(students))]

                    for s_idx, stu in enumerate(class_students):
                        s_token = await get_student_token(stu)
                        if not s_token:
                            continue
                        if not config.skip_biometric and s_idx < 5:
                            await student.register_student_biometrics(client)

                        is_outlier = s_idx % 6 == 0
                        await student.submit_attendance(client, session_id, tenant_info["lat"], tenant_info["lon"], is_outlier)

                    await get_teacher_token(teacher_info)
                    await teacher.stop_class_session(client, session_id)

            await teacher.review_flagged_attendance(client)

            # Leaves & device change requests
            for stu in students[: config.profile.leave_requests_count]:
                s_token = await get_student_token(stu)
                if s_token:
                    await student.apply_for_leave(client)

            for stu in students[: config.profile.device_change_requests_count]:
                dev_uuid = f"DEV-{stu['enrollment_number']}"
                new_dev_uuid = f"DEV-NEW-{stu['enrollment_number']}"
                await student.request_device_change(client, stu["email"], dev_uuid, new_dev_uuid)

            await get_teacher_token(teachers[0])
            await teacher.review_pending_leaves(client)
            await teacher.review_pending_device_changes(client)

            client.set_auth(token=admin_token, tenant_id=t_id)
            try:
                await client.post("/admin/scan-absentees")
                print("    ✓ Isolation Forest outlier absentee scanner verified.")
            except Exception:
                pass

            credentials_export["tenants"].append({
                "tenant_name": tenant_info["name"],
                "tenant_slug": t_slug,
                "admin": {"email": tenant_info["admin_email"], "password": tenant_info["admin_password"]},
                "sample_teachers": [
                    {"email": t["email"], "password": t["password"], "name": f"{t['first_name']} {t['last_name']}"}
                    for t in teachers[:3]
                ],
                "sample_students": [
                    {
                        "email": s["email"],
                        "password": s["password"],
                        "device_uuid": f"DEV-{s['enrollment_number']}",
                        "name": f"{s['first_name']} {s['last_name']}",
                    }
                    for s in students[:5]
                ],
            })

        with open(config.output_credentials_path, "w", encoding="utf-8") as f:
            json.dump(credentials_export, f, indent=2)

        elapsed = time.time() - start_time
        print("\n" + "=" * 64)
        print("🎉 REALISTIC API-DRIVEN SEEDING COMPLETED SUCCESSFULLY!")
        print(f"• Total Execution Time: {elapsed:.2f} seconds")
        print(f"• Credentials Saved:    {config.output_credentials_path}")
        print("=" * 64)

    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(run_seeder())
