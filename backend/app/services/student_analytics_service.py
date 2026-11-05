from prisma.models import Student

from app.core.datetime_utils import get_ist_today
from app.schemas.student_analytics import StreakFigures, StudentAnalyticsResponse, SubjectFigures
from app.services import student_subjects_service
from app.services.student_analytics import AT_RISK_MARGIN, figures, weekly_trend
from app.services.student_class_ledger import held_classes
from app.services.system_config_service import SystemConfigService


async def get_analytics(student: Student) -> StudentAnalyticsResponse:
    threshold = (await SystemConfigService().get_config(student.tenantId)).minAttendancePct
    subjects = await student_subjects_service.list_subjects(student)
    classes = await held_classes(student.id, student.tenantId)
    return StudentAnalyticsResponse(
        threshold=threshold,
        at_risk_margin=AT_RISK_MARGIN,
        overall=figures(sum(s.attended for s in subjects), sum(s.conducted for s in subjects), threshold),
        subjects=[
            SubjectFigures(
                **figures(s.attended, s.conducted, threshold).model_dump(),
                course_section_id=s.course_section_id,
                subject_name=s.subject_name,
                subject_code=s.subject_code,
                class_code=s.class_code,
                teacher_name=s.teacher_name,
            )
            for s in subjects
        ],
        weekly_trend=weekly_trend(classes, get_ist_today()),
        streak=StreakFigures(current=student.currentStreak or 0, best=student.highestStreak or 0),
    )
