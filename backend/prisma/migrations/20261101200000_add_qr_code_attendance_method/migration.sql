-- ==============================================================================
-- Migration: 20261101200000_add_qr_code_attendance_method
-- Description:
--   Students can mark attendance by scanning the rotating QR code that the
--   teacher shows for a live class. This is the non-biometric capture mode.
-- ==============================================================================

ALTER TYPE "AttendanceMethod" ADD VALUE IF NOT EXISTS 'QR_CODE' AFTER 'AI_BIOMETRIC';
