/// How a student marks attendance for a class. Decided by the institution's settings (PRD 6.3).
enum AttendanceMode {
  /// Face recognition on: selfie, liveness and background checks, plus the campus location check.
  biometric,

  /// Face recognition off: the student scans the rotating QR code on the teacher's screen.
  qrCode,
}

AttendanceMode attendanceModeFor({required bool faceRecognitionEnabled}) =>
    faceRecognitionEnabled ? AttendanceMode.biometric : AttendanceMode.qrCode;
