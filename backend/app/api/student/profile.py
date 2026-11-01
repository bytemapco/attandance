from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from prisma.models import Student

from app.api.dependencies import get_current_student
from app.api.student.helpers import rate_limit_student, save_uploaded_image, validate_image
from app.db.client import db
from app.schemas.common import MessageResponse
from app.schemas.student import FcmTokenRequest, StudentClassResponse
from app.services.attendance_service import AttendanceService
from app.services import student_subjects_service
from app.services.biometric_consent_service import BiometricConsentService
from app.services.s3_service import s3_service

router = APIRouter()


@router.post("/biometric/consent", response_model=MessageResponse)
async def submit_biometric_consent(
    policy_version: str = Form("2026.1-BIPA"),
    student: Student = Depends(get_current_student),
) -> MessageResponse:
    service = BiometricConsentService()
    await service.record_consent(student.id, policy_version=policy_version)
    return MessageResponse(status="success", message="Biometric consent successfully recorded.")


@router.get("/biometric/consent-status")
async def get_biometric_consent_status(
    student: Student = Depends(get_current_student),
) -> dict:
    service = BiometricConsentService()
    return await service.get_consent_status(student.id)


@router.post("/register-face", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def register_face(
    image: UploadFile = File(...),
    student: Student = Depends(get_current_student),
    attendance_service: AttendanceService = Depends(),
) -> MessageResponse:
    await rate_limit_student(student.id, max_requests=5, window_seconds=60)
    validate_image(image)
    image_url, image_bytes = await save_uploaded_image(image, "registration")
    try:
        consent_service = BiometricConsentService()
        if not await consent_service.has_consent(student.id):
            s3_service.delete_file(image_url)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Biometric consent is required prior to registering facial biometrics.",
            )
        success = await attendance_service.register_face(student.id, image_bytes)
        if not success:
            s3_service.delete_file(image_url)
            raise ValueError("Could not extract a valid face from the image.")
        return MessageResponse(status="success", message="Face embedding registered successfully.")
    except HTTPException:
        raise
    except ValueError as err:
        s3_service.delete_file(image_url)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except Exception:
        s3_service.delete_file(image_url)
        raise


@router.get("/classes", response_model=list[StudentClassResponse])
async def get_my_classes(student: Student = Depends(get_current_student)) -> list[StudentClassResponse]:
    return await student_subjects_service.list_classes(student)


@router.post("/fcm-token", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def register_fcm_token(
    data: FcmTokenRequest,
    student: Student = Depends(get_current_student),
) -> MessageResponse:
    await db.student.update(where={"id": student.id}, data={"fcmToken": data.token})
    return MessageResponse(status="success", message="FCM token registered.")
