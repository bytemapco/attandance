#!/usr/bin/env python3
"""Seed database entrypoint for Smart Attendance System (1 of each entity)."""

import asyncio
import os
from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv

load_dotenv(BACKEND_DIR / ".env")
if not os.getenv("DATABASE_URL"):
    load_dotenv(PROJECT_DIR / ".env")

from app.db.client import connect_db, db, disconnect_db
from scripts.seed_entities import seed_entities


def format_credentials(creds_data: dict) -> str:
    now_str = creds_data["now"].strftime("%Y-%m-%d %H:%M:%S UTC")
    sa_email, sa_pass = creds_data["super_admin"]
    ta_email, ta_pass = creds_data["tenant_admin"]
    t_email, t_pass = creds_data["teacher"]
    s_email, s_pass = creds_data["student"]

    return f"""================================================================================
SMART ATTENDANCE SYSTEM - DEFAULT CREDENTIALS (1 USER PER ROLE)
Generated: {now_str}
URL: http://localhost:3000/login
================================================================================

1. SUPER ADMIN (Full Platform Management)
   Email:    {sa_email}
   Password: {sa_pass}
   Role:     SUPER_ADMIN
   Access:   /super-admin/dashboard

2. INSTITUTION ADMIN (Apex Institute of Technology)
   Email:    {ta_email}
   Password: {ta_pass}
   Role:     TENANT_ADMIN
   Access:   /admin/dashboard

3. FACULTY / TEACHER
   Name:     Dr. Robert Hayes (Head of CS)
   Email:    {t_email}
   Password: {t_pass}
   Role:     TEACHER
   Class:    CS-6A: Distributed Systems
   Access:   /teacher/dashboard

4. STUDENT
   Name:     Alex Miller
   Email:    {s_email}
   Password: {s_pass}
   Role:     STUDENT
   Roll:     EN2024CS001 (Semester 6 - CSE)
   Access:   /student/dashboard
================================================================================
"""


async def run_seed():
    await connect_db()
    try:
        creds_data = await seed_entities(db)
        creds_text = format_credentials(creds_data)
        creds_path = PROJECT_DIR / "credentials.txt"
        with open(creds_path, "w", encoding="utf-8") as file_handle:
            file_handle.write(creds_text.strip() + "\n")
        print("✓ Database seeded successfully with exactly 1 of each entity.")
        print(f"✓ Credentials saved to {creds_path}")
    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(run_seed())
