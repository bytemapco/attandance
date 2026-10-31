"""Master E2E Test Suite Runner for Smart Attendance System."""

import asyncio
import sys
import time
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from scripts.e2e.e2e_client import E2EClient
from scripts.e2e.test_super_admin_flow import test_super_admin_flow
from scripts.e2e.test_tenant_admin_flow import test_tenant_admin_flow
from scripts.e2e.test_teacher_flow import test_teacher_flow
from scripts.e2e.test_student_flow import test_student_flow
from scripts.e2e.test_security_boundaries import test_security_boundaries


async def main() -> None:
    start_time = time.time()
    print("=" * 65)
    print("🚀 SMART ATTENDANCE SYSTEM — FULL END-TO-END VERIFICATION")
    print("=" * 65)

    async with E2EClient() as client:
        # Phase 1: Super Admin Flow
        tenant_info = await test_super_admin_flow(client)

        # Phase 2: Institutional Admin Flow
        admin_context = await test_tenant_admin_flow(client, tenant_info)

        # Phase 3: Faculty / Teacher & Session Flow
        teacher_context = await test_teacher_flow(client, admin_context)

        # Phase 4: Student Flow
        student_context = await test_student_flow(client, teacher_context)

        # Phase 5: Security Boundaries & RBAC
        await test_security_boundaries(client, {**tenant_info, **admin_context, **teacher_context, **student_context})

    duration = time.time() - start_time
    print("\n" + "=" * 65)
    print(f"🎉 ALL END-TO-END FLOWS COMPLETED SUCCESSFULLY in {duration:.2f}s!")
    print("• Multi-tenant Super Admin flow: PASS")
    print("• Institutional Admin operations: PASS")
    print("• Faculty Session & Attendance lifecycle: PASS")
    print("• Student Attendance & Profile flows: PASS")
    print("• Strict RBAC & Security boundaries: PASS")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
