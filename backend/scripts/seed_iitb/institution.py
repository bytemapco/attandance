"""The institution, its master data and its faculty."""

from datetime import datetime, timezone

from prisma import Json

from app.db.client import db

from . import data


async def _user(tenant_id: str, email: str, role: str, hashed: str):
    return await db.user.create(
        data={"tenantId": tenant_id, "email": email, "hashedPassword": hashed, "role": role, "isActive": True}
    )


async def _create_tenant():
    done = {"onboarding": {"completedAt": datetime.now(timezone.utc).isoformat()}}
    tenant = await db.tenant.create(
        data={
            "slug": "iitb",
            "name": "Indian Institute of Technology Bombay",
            "type": "COLLEGE",
            "status": "ACTIVE",
            "licenseCount": 500,
            "settings": Json(done),
        }
    )
    await db.systemconfiguration.create(
        data={
            "tenantId": tenant.id,
            "isFaceRecognitionEnabled": False,
            "isGpsVerificationEnabled": True,
            "isAiBackgroundValidationEnabled": False,
            "campusLatitude": data.CAMPUS["lat"],
            "campusLongitude": data.CAMPUS["lng"],
            "geofenceRadiusMeters": data.CAMPUS["radius_m"],
            "minAttendancePct": 75.0,
            "verificationWindowMin": 20,
            "saturdayEnabled": False,
        }
    )
    for number in range(1, 9):
        await db.academiclevel.create(
            data={"tenantId": tenant.id, "number": number, "name": f"Semester {number}", "isFinal": number == 8}
        )
    return tenant


def _head_name(dept_code: str):
    first, last, _, _ = next(t for t in data.TEACHERS if t[2] == dept_code)
    return f"Prof. {first} {last}"


async def _master_data(tenant_id: str) -> dict:
    departments = {}
    for code, name, _ in data.DEPARTMENTS:
        departments[code] = await db.department.create(
            data={"tenantId": tenant_id, "code": code, "name": name, "head": _head_name(code)}
        )
    designations = {
        code: await db.designation.create(data={"tenantId": tenant_id, "code": code, "name": name})
        for code, name in data.DESIGNATIONS
    }
    rooms = {
        name: await db.classroom.create(
            data={"tenantId": tenant_id, "name": name, "building": building, "capacity": capacity}
        )
        for name, building, capacity in data.CLASSROOMS
    }
    return {"departments": departments, "designations": designations, "rooms": rooms}


async def _subjects(tenant_id: str, departments: dict) -> dict:
    rows = [(code, name, dept) for dept, items in data.SUBJECTS.items() for code, name in items]
    rows.append(data.SHARED_SUBJECT)
    return {
        code: await db.subject.create(
            data={"tenantId": tenant_id, "departmentId": departments[dept].id, "code": code, "name": name}
        )
        for code, name, dept in rows
    }


async def _teachers(tenant_id: str, refs: dict, hashed: str) -> dict:
    by_dept: dict = {}
    for number, (first, last, dept, designation) in enumerate(data.TEACHERS, start=1):
        user = await _user(tenant_id, f"{first.lower()}.{dept.lower()}@yopmail.com", "TEACHER", hashed)
        teacher = await db.teacher.create(
            data={
                "tenantId": tenant_id,
                "userId": user.id,
                "departmentId": refs["departments"][dept].id,
                "designationId": refs["designations"][designation].id,
                "employeeId": f"F{1000 + number}",
                "firstName": first,
                "lastName": last,
                "nameInitials": f"{first[0]}{last[0]}",
                "phone": f"98200{10000 + number * 37:05d}",
            }
        )
        by_dept.setdefault(dept, []).append(teacher)
    return by_dept


async def create_institution(hashed: str) -> dict:
    tenant = await _create_tenant()
    refs = await _master_data(tenant.id)
    refs["subjects"] = await _subjects(tenant.id, refs["departments"])
    refs["teachers"] = await _teachers(tenant.id, refs, hashed)
    refs["admin"] = await _user(tenant.id, data.ADMIN_EMAIL, "TENANT_ADMIN", hashed)
    refs["tenant"] = tenant
    return refs
