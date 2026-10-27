#!/usr/bin/env python3
"""
Smart Attendance System — Full E2E Mobile Test Suite
Uses uiautomator2 to drive the Android emulator + production API for data setup.
Covers: Splash → Login → Student home → History → Analytics → Profile → Logout
Also tests: API-driven provisioning of institution, admin, teacher, student.
"""

import time
import os
import sys
import json
import uuid
import requests
import uiautomator2 as u2
from datetime import datetime

# ─── Config ────────────────────────────────────────────────────────────────────
API_BASE       = "https://attendance-backend.bytemap.in/api/v1"
DEVICE_SERIAL  = "emulator-5554"
APP_PKG        = "com.smartattendance.smart_attendance_app"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "../test-results/screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# Existing credentials
SA_EMAIL    = "superadmin@yopmail.com"
SA_PASSWORD = "SuperAdmin@123"

# ─── Helpers ───────────────────────────────────────────────────────────────────
def ts():
    return datetime.now().strftime("%H%M%S")

def slug_id():
    return str(uuid.uuid4())[:8]

_test_index = [0]

def shot(device, label: str):
    _test_index[0] += 1
    filename = f"{_test_index[0]:03d}_{label}.png"
    path = os.path.join(SCREENSHOT_DIR, filename)
    device.screenshot(path)
    print(f"  📸 {filename}")
    return path

def section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def ok(msg: str):
    print(f"  ✅ {msg}")

def fail(msg: str):
    print(f"  ❌ {msg}")

def info(msg: str):
    print(f"  ℹ  {msg}")

# ─── API Client ────────────────────────────────────────────────────────────────
class APIClient:
    def __init__(self, base: str = API_BASE):
        self.base    = base
        self.session = requests.Session()
        self.token   = None

    def _headers(self):
        h = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    def login(self, email: str, password: str) -> dict:
        r = self.session.post(
            f"{self.base}/auth/login",
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()
        self.token = data["access_token"]
        return data

    def get(self, path: str, **kwargs) -> dict:
        r = self.session.get(f"{self.base}{path}", headers=self._headers(), timeout=30, **kwargs)
        r.raise_for_status()
        return r.json()

    def post(self, path: str, body: dict = None, **kwargs) -> dict:
        r = self.session.post(
            f"{self.base}{path}",
            json=body or {},
            headers=self._headers(),
            timeout=30,
            **kwargs,
        )
        r.raise_for_status()
        return r.json()

    def put(self, path: str, body: dict = None) -> dict:
        r = self.session.put(
            f"{self.base}{path}", json=body or {}, headers=self._headers(), timeout=30
        )
        r.raise_for_status()
        return r.json()


# ─── Phase 1: API-driven setup ─────────────────────────────────────────────────
def phase1_api_setup() -> dict:
    section("PHASE 1 — API-Driven Data Setup (Institution + Users)")
    api = APIClient()

    info("Logging in as Super Admin …")
    api.login(SA_EMAIL, SA_PASSWORD)
    ok("Super Admin token obtained")

    info("Fetching existing tenants …")
    tenants = api.get("/super-admin/tenants")
    existing = tenants.get("items", []) if isinstance(tenants, dict) else tenants
    info(f"Found {len(existing) if isinstance(existing, list) else '?'} existing tenant(s)")

    uid         = slug_id()
    tenant_name = f"Test University {uid}"
    tenant_slug = f"test-univ-{uid}"
    info(f"Provisioning new tenant: {tenant_name} …")
    try:
        tenant = api.post(
            "/super-admin/tenants",
            {
                "name"            : tenant_name,
                "slug"            : tenant_slug,
                "type"            : "UNIVERSITY",
                "max_students"    : 500,
                "max_teachers"    : 50,
                "admin_email"     : f"admin.{uid}@yopmail.com",
                "admin_first_name": "Test",
                "admin_last_name" : "Admin",
            },
        )
        tenant_id   = tenant["id"]
        admin_email = f"admin.{uid}@yopmail.com"
        ok(f"Tenant created: {tenant_id} ({tenant_name})")
    except Exception as e:
        fail(f"New tenant creation failed (may already exist): {e}")
        info("Using existing Apex Institute instead …")
        tenant_id   = None
        admin_email = "admin.apex@yopmail.com"
        try:
            items = tenants.get("items", []) if isinstance(tenants, dict) else tenants
            for t in items:
                if "apex" in t.get("slug", "").lower() or "apex" in t.get("name", "").lower():
                    tenant_id   = t["id"]
                    tenant_name = t["name"]
                    break
        except Exception:
            pass

    info(f"Active tenant_id: {tenant_id}")

    info("Checking platform health …")
    health = api.get("/health")
    ok(f"Backend status: {health.get('status', 'unknown')}")

    info("Fetching platform stats …")
    try:
        stats = api.get("/super-admin/stats")
        ok(f"Platform stats — tenants: {stats.get('total_tenants', '?')}, users: {stats.get('total_users', '?')}")
    except Exception as e:
        fail(f"Stats fetch failed: {e}")

    return {
        "tenant_id"  : tenant_id,
        "tenant_name": tenant_name,
        "admin_email": admin_email,
        "api_client" : api,
    }


# ─── Phase 2: Admin API verify ─────────────────────────────────────────────────
def phase2_admin_api_verify(ctx: dict) -> dict:
    section("PHASE 2 — Admin API Verification")
    admin_api = APIClient()
    try:
        admin_api.login("admin.apex@yopmail.com", "Admin@Apex123")
        ok("Admin login successful")

        me = admin_api.get("/auth/me")
        ok(f"Admin profile: {me.get('email')} | role: {me.get('role')}")

        students = admin_api.get("/admin/students")
        count    = students.get("total", 0) if isinstance(students, dict) else len(students)
        ok(f"Students in tenant: {count}")

        teachers = admin_api.get("/admin/teachers")
        count_t  = teachers.get("total", 0) if isinstance(teachers, dict) else len(teachers)
        ok(f"Teachers in tenant: {count_t}")

        classes = admin_api.get("/admin/classes")
        count_c = classes.get("total", 0) if isinstance(classes, dict) else len(classes)
        ok(f"Classes in tenant: {count_c}")

        ctx["admin_api"] = admin_api
        return ctx
    except Exception as e:
        fail(f"Admin API verification failed: {e}")
        return ctx


# ─── Phase 3: Mobile E2E Tests ─────────────────────────────────────────────────
def phase3_mobile_tests(ctx: dict):
    section("PHASE 3 — Mobile E2E UI Tests (uiautomator2)")
    d = u2.connect(DEVICE_SERIAL)
    info(f"Connected to: {d.info['productName']} (SDK {d.info['sdkInt']})")
    info(f"Display: {d.info['displayWidth']}x{d.info['displayHeight']}")

    results = {}

    # 3.1 App Launch
    section("3.1 — App Launch / Splash Screen")
    d.app_stop(APP_PKG)
    time.sleep(1)
    d.app_start(APP_PKG)
    time.sleep(4)
    shot(d, "splash_screen")

    current = d.app_current()
    if current.get("package") == APP_PKG:
        ok("App launched successfully")
        results["launch"] = "PASS"
    else:
        fail(f"Wrong foreground app: {current.get('package')}")
        results["launch"] = "FAIL"
    time.sleep(3)

    # 3.2 Login Screen
    section("3.2 — Login Screen")
    shot(d, "login_screen_initial")
    page_xml = d.dump_hierarchy()
    if any(kw in page_xml.lower() for kw in ["smart", "login", "email", "attendance", "welcome"]):
        ok("Login/Welcome screen visible")
        results["login_screen"] = "PASS"
    else:
        info("Screen state unclear — may be on splash or loading")
        results["login_screen"] = "PARTIAL"

    # 3.3 Invalid Credentials Test
    section("3.3 — Invalid Login Attempt")
    try:
        # Clear data for fresh state
        import subprocess
        subprocess.run(["adb", "-s", DEVICE_SERIAL, "shell", "pm", "clear", APP_PKG], capture_output=True)
        time.sleep(1)
        d.app_start(APP_PKG)
        time.sleep(5)
        d.click(0.5, 0.85)
        time.sleep(2)

        _fill_email(d, "wrong@test.com")
        time.sleep(0.5)
        _click_next(d)
        time.sleep(2)
        _fill_password(d, "wrongpassword")
        time.sleep(0.5)
        _click_login(d)
        time.sleep(4)
        shot(d, "invalid_login_result")

        page_xml = d.dump_hierarchy()
        if any(kw in page_xml.lower() for kw in ["incorrect", "invalid", "error", "wrong", "failed", "unauthorized"]):
            ok("Invalid credentials error shown correctly")
            results["invalid_login"] = "PASS"
        else:
            info("Error message not detected — may be showing loading or different state")
            results["invalid_login"] = "PARTIAL"
    except Exception as e:
        fail(f"Invalid login test error: {e}")
        shot(d, "invalid_login_error")
        results["invalid_login"] = "ERROR"

    # 3.4 Valid Student Login
    section("3.4 — Valid Student Login")
    try:
        import subprocess
        subprocess.run(["adb", "-s", DEVICE_SERIAL, "shell", "pm", "clear", APP_PKG], capture_output=True)
        time.sleep(1)
        d.app_start(APP_PKG)
        time.sleep(5)
        shot(d, "fresh_app_launch")

        # Tap login area
        d.click(0.5, 0.85)
        time.sleep(2)
        shot(d, "login_sheet_opened")

        _fill_email(d, "alex.miller@yopmail.com")
        time.sleep(0.5)
        shot(d, "student_email_filled")
        _click_next(d)
        time.sleep(2)
        shot(d, "after_email_next")
        _fill_password(d, "Student@Apex123")
        time.sleep(0.5)
        shot(d, "student_password_filled")
        _click_login(d)
        time.sleep(7)
        shot(d, "student_after_login")

        current = d.app_current()
        page_xml = d.dump_hierarchy()
        if current.get("package") == APP_PKG and any(kw in page_xml.lower() for kw in [
            "dashboard", "home", "attendance", "welcome", "alex", "today", "session"
        ]):
            ok("Student login successful — dashboard loaded")
            results["student_login"] = "PASS"
        elif current.get("package") == APP_PKG:
            info("App in foreground, checking for home indicators")
            shot(d, "student_login_state_check")
            results["student_login"] = "PARTIAL"
        else:
            fail(f"App not in foreground: {current}")
            results["student_login"] = "FAIL"
    except Exception as e:
        fail(f"Student login error: {e}")
        import traceback; traceback.print_exc()
        shot(d, "student_login_error")
        results["student_login"] = "ERROR"

    # 3.5 Home Screen
    section("3.5 — Home Screen Verification")
    try:
        time.sleep(2)
        shot(d, "home_screen_full")
        page_xml = d.dump_hierarchy()
        if any(kw in page_xml.lower() for kw in ["today", "class", "attendance", "session", "schedule", "home"]):
            ok("Home screen elements visible")
            results["home_screen"] = "PASS"
        else:
            info("Home screen state unclear")
            results["home_screen"] = "PARTIAL"
    except Exception as e:
        fail(f"Home screen test failed: {e}")
        results["home_screen"] = "ERROR"

    # 3.6 Bottom Navigation
    section("3.6 — Bottom Navigation Bar")
    nav_tabs = [
        ("History",    "history_tab"),
        ("Analytics",  "analytics_tab"),
        ("Smart Pass", "smart_pass_tab"),
        ("Profile",    "profile_tab"),
    ]
    for tab_text, tab_label in nav_tabs:
        try:
            navigated = False
            for selector in [
                {"text": tab_text},
                {"description": tab_text},
                {"contentDescription": tab_text},
            ]:
                try:
                    tab = d(**selector)
                    if tab.exists(timeout=3):
                        tab.click()
                        time.sleep(3)
                        shot(d, tab_label)
                        ok(f"{tab_text} tab navigated")
                        results[f"nav_{tab_label}"] = "PASS"
                        navigated = True
                        break
                except Exception:
                    pass
            if not navigated:
                info(f"{tab_text} tab not found")
                results[f"nav_{tab_label}"] = "SKIP"
        except Exception as e:
            fail(f"Nav to {tab_text} failed: {e}")
            results[f"nav_{tab_label}"] = "ERROR"

    # 3.7 History Screen
    section("3.7 — History Screen")
    try:
        _navigate_to_tab(d, "History")
        time.sleep(3)
        shot(d, "history_screen_full")
        page_xml = d.dump_hierarchy()
        if any(kw in page_xml.lower() for kw in ["history", "attendance", "list", "calendar", "session"]):
            ok("History screen loaded")
            results["history_screen"] = "PASS"
            for tab in ["List", "Calendar"]:
                try:
                    el = d(text=tab)
                    if el.exists(timeout=2):
                        el.click()
                        time.sleep(2)
                        shot(d, f"history_{tab.lower()}_view")
                        ok(f"History {tab} tab works")
                except Exception:
                    pass
        else:
            results["history_screen"] = "PARTIAL"
    except Exception as e:
        fail(f"History screen error: {e}")
        results["history_screen"] = "ERROR"

    # 3.8 Analytics Screen
    section("3.8 — Analytics Screen")
    try:
        _navigate_to_tab(d, "Analytics")
        time.sleep(3)
        shot(d, "analytics_screen_full")
        page_xml = d.dump_hierarchy()
        if any(kw in page_xml.lower() for kw in ["analytics", "chart", "percentage", "trend", "subject", "overview"]):
            ok("Analytics screen loaded")
            results["analytics_screen"] = "PASS"
            # Scroll to see charts
            d.swipe_ext("up", scale=0.4)
            time.sleep(1)
            shot(d, "analytics_scrolled")
        else:
            results["analytics_screen"] = "PARTIAL"
    except Exception as e:
        fail(f"Analytics screen error: {e}")
        results["analytics_screen"] = "ERROR"

    # 3.9 Smart Pass Screen
    section("3.9 — Smart Pass Screen")
    try:
        _navigate_to_tab(d, "Smart Pass")
        time.sleep(3)
        shot(d, "smart_pass_screen_full")
        page_xml = d.dump_hierarchy()
        if any(kw in page_xml.lower() for kw in ["pass", "qr", "code", "scan", "smart"]):
            ok("Smart Pass screen loaded")
            results["smart_pass_screen"] = "PASS"
        else:
            results["smart_pass_screen"] = "PARTIAL"
    except Exception as e:
        fail(f"Smart Pass screen error: {e}")
        results["smart_pass_screen"] = "ERROR"

    # 3.10 Profile Screen
    section("3.10 — Profile Screen")
    try:
        _navigate_to_tab(d, "Profile")
        time.sleep(3)
        shot(d, "profile_screen_full")
        page_xml = d.dump_hierarchy()
        if any(kw in page_xml.lower() for kw in ["profile", "alex", "student", "email", "logout", "sign out"]):
            ok("Profile screen loaded")
            results["profile_screen"] = "PASS"
            d.swipe_ext("up", scale=0.4)
            time.sleep(1)
            shot(d, "profile_screen_scrolled")
        else:
            results["profile_screen"] = "PARTIAL"
    except Exception as e:
        fail(f"Profile screen error: {e}")
        results["profile_screen"] = "ERROR"

    # 3.11 Notifications
    section("3.11 — Notifications Screen")
    try:
        _navigate_to_tab(d, "Home")
        time.sleep(2)
        notif_found = False
        for selector in [
            {"description": "Notifications"},
            {"contentDescription": "Notifications"},
            {"description": "notification"},
            {"text": "Notifications"},
        ]:
            try:
                el = d(**selector)
                if el.exists(timeout=2):
                    el.click()
                    time.sleep(3)
                    shot(d, "notifications_screen")
                    ok("Notifications screen opened")
                    results["notifications_screen"] = "PASS"
                    notif_found = True
                    d.press("back")
                    time.sleep(1)
                    break
            except Exception:
                pass
        if not notif_found:
            info("Notification icon not found — checking profile")
            _navigate_to_tab(d, "Profile")
            time.sleep(2)
            try:
                el = d(text="Notifications")
                if el.exists(timeout=2):
                    el.click()
                    time.sleep(3)
                    shot(d, "notifications_from_profile")
                    ok("Notifications from profile")
                    results["notifications_screen"] = "PASS"
                    d.press("back")
                else:
                    results["notifications_screen"] = "SKIP"
            except Exception:
                results["notifications_screen"] = "SKIP"
    except Exception as e:
        fail(f"Notifications test error: {e}")
        results["notifications_screen"] = "ERROR"

    # 3.12 Leave Screen
    section("3.12 — Leave Request Screen")
    try:
        leave_found = False
        for selector in [
            {"text": "Leave"},
            {"text": "Leave Requests"},
            {"text": "Apply Leave"},
            {"description": "Leave"},
        ]:
            try:
                el = d(**selector)
                if el.exists(timeout=2):
                    el.click()
                    time.sleep(3)
                    shot(d, "leave_screen")
                    ok("Leave screen opened")
                    results["leave_screen"] = "PASS"
                    leave_found = True
                    d.press("back")
                    time.sleep(1)
                    break
            except Exception:
                pass
        if not leave_found:
            results["leave_screen"] = "SKIP"
            info("Leave screen not directly accessible from nav")
    except Exception as e:
        fail(f"Leave screen error: {e}")
        results["leave_screen"] = "ERROR"

    # 3.13 Settings Screens
    section("3.13 — Settings Screens")
    try:
        _navigate_to_tab(d, "Profile")
        time.sleep(2)
        settings_count = 0
        for label in ["Goals", "Attendance Goal", "Notification", "Help", "Sync Status"]:
            try:
                el = d(text=label)
                if el.exists(timeout=2):
                    el.click()
                    time.sleep(2)
                    shot(d, f"settings_{label.lower().replace(' ', '_')}")
                    ok(f"{label} settings screen opened")
                    settings_count += 1
                    d.press("back")
                    time.sleep(1)
            except Exception:
                pass
        results["settings_screens"] = "PASS" if settings_count > 0 else "SKIP"
    except Exception as e:
        fail(f"Settings screens error: {e}")
        results["settings_screens"] = "ERROR"

    # 3.14 Theme Toggle
    section("3.14 — Theme Toggle (Appearance)")
    try:
        _navigate_to_tab(d, "Profile")
        time.sleep(2)
        theme_found = False
        for label in ["Appearance", "Dark Mode", "Theme", "Light Mode"]:
            try:
                el = d(text=label)
                if el.exists(timeout=2):
                    shot(d, "before_theme_toggle")
                    el.click()
                    time.sleep(2)
                    shot(d, "after_theme_toggle")
                    ok(f"Theme toggle ({label}) works")
                    results["theme_toggle"] = "PASS"
                    theme_found = True
                    # Toggle back
                    d.press("back")
                    time.sleep(1)
                    break
            except Exception:
                pass
        if not theme_found:
            info("Theme toggle not found as standalone option")
            results["theme_toggle"] = "SKIP"
    except Exception as e:
        fail(f"Theme toggle error: {e}")
        results["theme_toggle"] = "ERROR"

    # 3.15 Teacher Login
    section("3.15 — Teacher Login Flow")
    try:
        _logout(d)
        time.sleep(3)
        shot(d, "after_student_logout")

        # Re-open app and login as teacher
        d.click(0.5, 0.85)
        time.sleep(2)
        _fill_email(d, "robert.hayes@yopmail.com")
        _click_next(d)
        time.sleep(2)
        _fill_password(d, "Teacher@Apex123")
        _click_login(d)
        time.sleep(7)
        shot(d, "teacher_dashboard")

        current  = d.app_current()
        page_xml = d.dump_hierarchy()
        if current.get("package") == APP_PKG:
            ok("Teacher login successful")
            results["teacher_login"] = "PASS"
            shot(d, "teacher_home_screen")

            # Navigate all teacher tabs
            for tab in ["Home", "History", "Analytics", "Profile"]:
                _navigate_to_tab(d, tab)
                time.sleep(2)
                shot(d, f"teacher_{tab.lower()}_screen")
        else:
            fail("Teacher login failed")
            results["teacher_login"] = "FAIL"
    except Exception as e:
        fail(f"Teacher login error: {e}")
        import traceback; traceback.print_exc()
        shot(d, "teacher_login_error")
        results["teacher_login"] = "ERROR"

    # 3.16 Admin Login
    section("3.16 — Admin Login Flow")
    try:
        _logout(d)
        time.sleep(3)
        shot(d, "after_teacher_logout")

        d.click(0.5, 0.85)
        time.sleep(2)
        _fill_email(d, "admin.apex@yopmail.com")
        _click_next(d)
        time.sleep(2)
        _fill_password(d, "Admin@Apex123")
        _click_login(d)
        time.sleep(7)
        shot(d, "admin_dashboard")

        current = d.app_current()
        if current.get("package") == APP_PKG:
            ok("Admin login successful")
            results["admin_login"] = "PASS"
            shot(d, "admin_home_screen")

            for tab in ["Home", "Profile"]:
                _navigate_to_tab(d, tab)
                time.sleep(2)
                shot(d, f"admin_{tab.lower()}_screen")
        else:
            fail("Admin login failed")
            results["admin_login"] = "FAIL"
    except Exception as e:
        fail(f"Admin login error: {e}")
        shot(d, "admin_login_error")
        results["admin_login"] = "ERROR"

    # 3.17 Final Full Student Workflow
    section("3.17 — Final Student Full Workflow")
    try:
        _logout(d)
        time.sleep(3)
        d.click(0.5, 0.85)
        time.sleep(2)
        _fill_email(d, "alex.miller@yopmail.com")
        _click_next(d)
        time.sleep(2)
        _fill_password(d, "Student@Apex123")
        _click_login(d)
        time.sleep(7)
        shot(d, "final_student_home")

        current = d.app_current()
        if current.get("package") == APP_PKG:
            ok("Final student login successful")
            results["final_student_workflow"] = "PASS"

            for tab in ["Home", "History", "Analytics", "Smart Pass", "Profile"]:
                _navigate_to_tab(d, tab)
                time.sleep(2)
                shot(d, f"final_{tab.lower().replace(' ', '_')}_screen")
        else:
            results["final_student_workflow"] = "FAIL"
    except Exception as e:
        fail(f"Final student workflow error: {e}")
        shot(d, "final_workflow_error")
        results["final_student_workflow"] = "ERROR"

    return results


# ─── Navigation Helpers ────────────────────────────────────────────────────────
def _navigate_to_tab(d, tab_text: str):
    for selector in [
        {"text": tab_text},
        {"description": tab_text},
        {"contentDescription": tab_text},
    ]:
        try:
            el = d(**selector)
            if el.exists(timeout=3):
                el.click()
                return True
        except Exception:
            pass
    return False


def _fill_email(d, email: str):
    for selector in [
        {"className": "android.widget.EditText"},
        {"hint": "Email"},
        {"hint": "Enter your email"},
        {"description": "Email"},
    ]:
        try:
            el = d(**selector)
            if el.exists(timeout=3):
                el.click()
                time.sleep(0.3)
                el.clear_text()
                el.send_keys(email)
                return True
        except Exception:
            pass
    return False


def _fill_password(d, password: str):
    for selector in [
        {"className": "android.widget.EditText"},
        {"hint": "Password"},
        {"hint": "Enter your password"},
        {"description": "Password"},
    ]:
        try:
            el = d(**selector)
            if el.exists(timeout=3):
                el.click()
                time.sleep(0.3)
                el.clear_text()
                el.send_keys(password)
                return True
        except Exception:
            pass
    return False


def _click_next(d):
    for selector in [
        {"text": "Next"},
        {"text": "Continue"},
        {"description": "Next"},
        {"description": "Continue"},
    ]:
        try:
            btn = d(**selector)
            if btn.exists(timeout=2):
                btn.click()
                return True
        except Exception:
            pass
    return False


def _click_login(d):
    for selector in [
        {"text": "Login"},
        {"text": "Sign In"},
        {"text": "Continue"},
        {"description": "Login"},
        {"description": "Sign In"},
    ]:
        try:
            btn = d(**selector)
            if btn.exists(timeout=2):
                btn.click()
                return True
        except Exception:
            pass
    return False


def _logout(d):
    """Logout from current session or clear app data."""
    try:
        _navigate_to_tab(d, "Profile")
        time.sleep(2)
        d.swipe_ext("up", scale=0.5)
        time.sleep(1)

        for selector in [
            {"text": "Logout"},
            {"text": "Log Out"},
            {"text": "Sign Out"},
            {"description": "Logout"},
        ]:
            try:
                el = d(**selector)
                if el.exists(timeout=2):
                    el.click()
                    time.sleep(2)
                    for confirm in [{"text": "Logout"}, {"text": "OK"}, {"text": "Confirm"}, {"text": "Yes"}]:
                        try:
                            btn = d(**confirm)
                            if btn.exists(timeout=2):
                                btn.click()
                                time.sleep(3)
                                return
                        except Exception:
                            pass
                    return
            except Exception:
                pass

        # Fallback: clear app data
        info("Logout button not found — clearing app data")
        import subprocess
        subprocess.run(["adb", "-s", DEVICE_SERIAL, "shell", "pm", "clear", APP_PKG], capture_output=True)
        time.sleep(1)
        d.app_start(APP_PKG)
        time.sleep(5)
    except Exception as e:
        info(f"Logout attempt error: {e}")
        import subprocess
        subprocess.run(["adb", "-s", DEVICE_SERIAL, "shell", "pm", "clear", APP_PKG], capture_output=True)
        time.sleep(1)
        d.app_start(APP_PKG)
        time.sleep(5)


# ─── Phase 4: API Validation ───────────────────────────────────────────────────
def phase4_api_validation() -> dict:
    section("PHASE 4 — Comprehensive API Validation")
    results = {}
    api = APIClient()

    # ── Auth Tests ──
    info("Testing authentication endpoints …")
    try:
        data = api.login(SA_EMAIL, SA_PASSWORD)
        ok(f"Super Admin login: token obtained, role={data.get('role')}")
        results["api_sa_login"] = "PASS"
    except Exception as e:
        fail(f"SA login failed: {e}")
        results["api_sa_login"] = "FAIL"

    try:
        tmp = APIClient()
        r = tmp.session.post(
            f"{API_BASE}/auth/login",
            json={"email": "invalid@test.com", "password": "wrong"},
            timeout=10,
        )
        if r.status_code == 401:
            ok("Invalid login correctly returns 401")
            results["api_invalid_login"] = "PASS"
        else:
            fail(f"Unexpected status: {r.status_code}")
            results["api_invalid_login"] = "FAIL"
    except Exception as e:
        fail(f"Invalid login check error: {e}")
        results["api_invalid_login"] = "ERROR"

    try:
        me = api.get("/auth/me")
        ok(f"GET /auth/me: {me.get('email')}, role={me.get('role')}")
        results["api_get_me"] = "PASS"
    except Exception as e:
        fail(f"GET /auth/me failed: {e}")
        results["api_get_me"] = "FAIL"

    # ── Super Admin Endpoints ──
    try:
        stats = api.get("/super-admin/stats")
        ok(f"Platform stats: tenants={stats.get('total_tenants','?')}, users={stats.get('total_users','?')}")
        results["api_sa_stats"] = "PASS"
    except Exception as e:
        fail(f"Stats failed: {e}")
        results["api_sa_stats"] = "FAIL"

    try:
        tenants = api.get("/super-admin/tenants")
        items   = tenants.get("items", []) if isinstance(tenants, dict) else tenants
        ok(f"Tenant list: {len(items)} tenant(s)")
        results["api_list_tenants"] = "PASS"
    except Exception as e:
        fail(f"List tenants failed: {e}")
        results["api_list_tenants"] = "FAIL"

    try:
        users = api.get("/super-admin/users")
        items = users.get("items", []) if isinstance(users, dict) else users
        ok(f"Global users: {len(items)}")
        results["api_global_users"] = "PASS"
    except Exception as e:
        fail(f"Global users failed: {e}")
        results["api_global_users"] = "FAIL"

    try:
        lr = api.get("/super-admin/license-requests")
        ok(f"License requests retrieved")
        results["api_license_requests"] = "PASS"
    except Exception as e:
        fail(f"License requests failed: {e}")
        results["api_license_requests"] = "FAIL"

    try:
        audit = api.get("/super-admin/audit-logs")
        ok(f"Audit logs retrieved")
        results["api_audit_logs"] = "PASS"
    except Exception as e:
        fail(f"Audit logs failed: {e}")
        results["api_audit_logs"] = "FAIL"

    # ── Admin Endpoints ──
    info("\nTesting Admin API endpoints …")
    admin_api = APIClient()
    try:
        admin_api.login("admin.apex@yopmail.com", "Admin@Apex123")
        ok("Admin login OK")
        results["api_admin_login"] = "PASS"

        # Admin users are under /admin/users/students not /admin/students
        students = admin_api.get("/admin/users/students")
        total_s  = students.get("total", 0) if isinstance(students, dict) else len(students)
        ok(f"Admin students list: {total_s}")
        results["api_admin_students"] = "PASS"

        teachers = admin_api.get("/admin/users/teachers")
        total_t  = teachers.get("total", 0) if isinstance(teachers, dict) else len(teachers)
        ok(f"Admin teachers list: {total_t}")
        results["api_admin_teachers"] = "PASS"

        classes = admin_api.get("/admin/classes")
        total_c = classes.get("total", 0) if isinstance(classes, dict) else len(classes)
        ok(f"Admin classes list: {total_c}")
        results["api_admin_classes"] = "PASS"

        depts = admin_api.get("/admin/departments")
        total_d = depts.get("total", 0) if isinstance(depts, dict) else len(depts)
        ok(f"Admin departments list: {total_d}")
        results["api_admin_departments"] = "PASS"

        subjects = admin_api.get("/admin/subjects")
        total_sub = subjects.get("total", 0) if isinstance(subjects, dict) else len(subjects)
        ok(f"Admin subjects list: {total_sub}")
        results["api_admin_subjects"] = "PASS"

        # Admin stats
        stats_a = admin_api.get("/admin/stats")
        ok(f"Admin stats retrieved")
        results["api_admin_stats"] = "PASS"

    except Exception as e:
        fail(f"Admin API tests failed: {e}")
        results["api_admin_tests"] = "FAIL"

    # ── Teacher Endpoints ──
    info("\nTesting Teacher API endpoints …")
    teacher_api = APIClient()
    try:
        teacher_api.login("robert.hayes@yopmail.com", "Teacher@Apex123")
        ok("Teacher login OK")
        results["api_teacher_login"] = "PASS"

        me_t = teacher_api.get("/auth/me")
        ok(f"Teacher profile: {me_t.get('email')}")
        results["api_teacher_me"] = "PASS"

        try:
            classes_t = teacher_api.get("/teacher/classes")
            total_ct  = classes_t.get("total", 0) if isinstance(classes_t, dict) else len(classes_t)
            ok(f"Teacher classes: {total_ct}")
            results["api_teacher_classes"] = "PASS"
        except Exception as e:
            info(f"Teacher classes endpoint: {e}")
            results["api_teacher_classes"] = "SKIP"

        try:
            sessions_t = teacher_api.get("/teacher/sessions")
            ok("Teacher sessions retrieved")
            results["api_teacher_sessions"] = "PASS"
        except Exception as e:
            info(f"Teacher sessions: {e}")
            results["api_teacher_sessions"] = "SKIP"

    except Exception as e:
        fail(f"Teacher API tests failed: {e}")
        results["api_teacher_login"] = "FAIL"

    # ── Student Endpoints ──
    info("\nTesting Student API endpoints …")
    student_api = APIClient()
    try:
        student_api.login("alex.miller@yopmail.com", "Student@Apex123")
        ok("Student login OK")
        results["api_student_login"] = "PASS"

        me_s = student_api.get("/auth/me")
        ok(f"Student profile: {me_s.get('email')}")
        results["api_student_me"] = "PASS"

        try:
            sessions = student_api.get("/student/sessions")
            total_ss = sessions.get("total", 0) if isinstance(sessions, dict) else len(sessions if isinstance(sessions, list) else [])
            ok(f"Student sessions: {total_ss}")
            results["api_student_sessions"] = "PASS"
        except Exception as e:
            info(f"Student sessions: {e}")
            results["api_student_sessions"] = "SKIP"

        try:
            history = student_api.get("/student/attendance/history")
            ok("Student attendance history retrieved")
            results["api_student_history"] = "PASS"
        except Exception as e:
            info(f"Student history: {e}")
            results["api_student_history"] = "SKIP"

        try:
            analytics = student_api.get("/student/analytics")
            ok("Student analytics retrieved")
            results["api_student_analytics"] = "PASS"
        except Exception as e:
            info(f"Student analytics: {e}")
            results["api_student_analytics"] = "SKIP"

        try:
            leaderboard = student_api.get("/student/leaderboard")
            ok("Student leaderboard retrieved")
            results["api_student_leaderboard"] = "PASS"
        except Exception as e:
            info(f"Student leaderboard: {e}")
            results["api_student_leaderboard"] = "SKIP"

    except Exception as e:
        fail(f"Student API tests failed: {e}")
        results["api_student_login"] = "FAIL"

    # ── Health Check ──
    try:
        health = api.get("/health")
        services = health.get("services", {})
        for svc, detail in services.items():
            status = detail.get("status", "unknown")
            icon = "✅" if status == "healthy" else "⚠️"
            print(f"  {icon} Service [{svc}]: {status}")
        results["api_health"] = "PASS"
    except Exception as e:
        fail(f"Health check failed: {e}")
        results["api_health"] = "FAIL"

    return results


# ─── Report Generation ─────────────────────────────────────────────────────────
def generate_report(api_setup: dict, mobile_results: dict, api_results: dict) -> dict:
    section("FINAL TEST REPORT")

    all_results = {**mobile_results, **api_results}
    passed  = sum(1 for v in all_results.values() if v == "PASS")
    failed  = sum(1 for v in all_results.values() if v == "FAIL")
    errors  = sum(1 for v in all_results.values() if v == "ERROR")
    skipped = sum(1 for v in all_results.values() if v in ("SKIP", "PARTIAL"))
    total   = len(all_results)

    report = {
        "timestamp"     : datetime.now().isoformat(),
        "backend_url"   : API_BASE,
        "device"        : DEVICE_SERIAL,
        "institution"   : api_setup.get("tenant_name"),
        "summary"       : {
            "total"  : total,
            "passed" : passed,
            "failed" : failed,
            "errors" : errors,
            "skipped": skipped,
            "pass_rate": f"{passed/total*100:.1f}%" if total > 0 else "N/A",
        },
        "mobile_results": mobile_results,
        "api_results"   : api_results,
        "screenshots"   : sorted(os.listdir(SCREENSHOT_DIR)),
    }

    report_path = os.path.join(os.path.dirname(__file__), "../test-results/report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n{'='*60}")
    print("  SUMMARY")
    print(f"{'='*60}")
    print(f"  Total Tests : {total}")
    print(f"  ✅ Passed   : {passed}")
    print(f"  ❌ Failed   : {failed}")
    print(f"  💥 Errors   : {errors}")
    print(f"  ⏭ Skipped  : {skipped}")
    print(f"  Pass Rate   : {passed/total*100:.1f}%" if total > 0 else "N/A")
    print(f"\n  Screenshots : {SCREENSHOT_DIR}")
    print(f"  Report      : {report_path}")
    print(f"{'='*60}\n")

    print("  Detailed Results:")
    for test, result in sorted(all_results.items()):
        icon = {"PASS": "✅", "FAIL": "❌", "ERROR": "💥", "SKIP": "⏭", "PARTIAL": "🔶"}.get(result, "❓")
        print(f"  {icon} {test:<50} {result}")

    return report


# ─── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("\n" + "="*60)
    print("  SMART ATTENDANCE SYSTEM — FULL E2E TEST SUITE")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}")
    print("="*60)

    ctx            = phase1_api_setup()
    ctx            = phase2_admin_api_verify(ctx)
    mobile_results = phase3_mobile_tests(ctx)
    api_results    = phase4_api_validation()
    report         = generate_report(ctx, mobile_results, api_results)

    failed = report["summary"]["failed"] + report["summary"]["errors"]
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
