"""Seed academic entities (faculty, student, class, session, attendance, leave)."""

from datetime import datetime, timedelta, timezone
from app.core.security import hash_password


async def seed_academic_structure(db, tenant_id: str):
    dept = await db.department.create(
        data={
            "tenantId": tenant_id,
            "code": "CSE",
            "name": "Computer Science & Engineering",
            "head": "Dr. Robert Hayes",
            "description": "Core software and systems engineering.",
        }
    )

    desig = await db.designation.create(
        data={
            "tenantId": tenant_id,
            "code": "ASST_PROF",
            "name": "Assistant Professor",
            "description": "Senior Academic Instructor",
        }
    )

    room = await db.classroom.create(
        data={
            "tenantId": tenant_id,
            "name": "Hall 101",
            "building": "Engineering Block A",
            "capacity": 60,
        }
    )

    sub = await db.subject.create(
        data={
            "tenantId": tenant_id,
            "departmentId": dept.id,
            "code": "CS101",
            "name": "Distributed Systems",
            "description": "Distributed architectures and protocols.",
        }
    )

    teacher_email = "robert.hayes@yopmail.com"
    teacher_pass = "Teacher@Apex123"
    teacher_user = await db.user.create(
        data={
            "email": teacher_email,
            "hashedPassword": hash_password(teacher_pass),
            "role": "TEACHER",
            "tenantId": tenant_id,
            "isActive": True,
        }
    )
    teacher = await db.teacher.create(
        data={
            "tenantId": tenant_id,
            "userId": teacher_user.id,
            "departmentId": dept.id,
            "designationId": desig.id,
            "employeeId": "APEX-FAC-001",
            "firstName": "Robert",
            "lastName": "Hayes",
            "nameInitials": "RH",
            "phone": "+1 (555) 201-4401",
        }
    )

    student_email = "alex.miller@yopmail.com"
    student_pass = "Student@Apex123"
    student_user = await db.user.create(
        data={
            "email": student_email,
            "hashedPassword": hash_password(student_pass),
            "role": "STUDENT",
            "tenantId": tenant_id,
            "isActive": True,
        }
    )
    student = await db.student.create(
        data={
            "tenantId": tenant_id,
            "userId": student_user.id,
            "departmentId": dept.id,
            "enrollmentNumber": "EN2024CS001",
            "firstName": "Alex",
            "lastName": "Miller",
            "branch": "CS",
            "semester": 6,
            "batch": "2021-2025",
            "phone": "+1 (555) 301-5501",
            "currentStreak": 5,
            "highestStreak": 12,
        }
    )

    ac_class = await db.academicclass.create(
        data={
            "tenantId": tenant_id,
            "name": "CS-6A: Distributed Systems",
            "subjectId": sub.id,
            "teacherId": teacher.id,
            "classroomId": room.id,
            "semester": 6,
            "batch": "2021-2025",
        }
    )

    await db.geofence.create(
        data={
            "academicClassId": ac_class.id,
            "latitude": 37.7749,
            "longitude": -122.4194,
            "radiusMeters": 50.0,
        }
    )

    await db.enrollment.create(
        data={
            "studentId": student.id,
            "academicClassId": ac_class.id,
        }
    )

    now = datetime.now(timezone.utc)
    session = await db.session.create(
        data={
            "tenantId": tenant_id,
            "academicClassId": ac_class.id,
            "startTime": now - timedelta(hours=1),
            "endTime": now,
            "isActive": False,
        }
    )

    await db.attendance.create(
        data={
            "tenantId": tenant_id,
            "sessionId": session.id,
            "studentId": student.id,
            "status": "PRESENT",
            "faceScore": 0.98,
            "livenessScore": 0.99,
            "backgroundScore": 0.95,
            "finalAiScore": 0.97,
            "gpsLatitude": 37.7749,
            "gpsLongitude": -122.4194,
            "remarks": "Facial verification confirmed with high confidence.",
        }
    )

    await db.leaverequest.create(
        data={
            "tenantId": tenant_id,
            "studentId": student.id,
            "startDate": now + timedelta(days=1),
            "endDate": now + timedelta(days=2),
            "reason": "ACM Student Chapter Symposium",
            "status": "APPROVED",
            "approvedBy": "Dr. Robert Hayes",
            "approverNote": "Authorized for representing college.",
        }
    )

    return {
        "teacher": (teacher_email, teacher_pass),
        "student": (student_email, student_pass),
    }
