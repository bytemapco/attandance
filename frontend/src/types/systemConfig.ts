/** Institution settings from GET /admin/config. Campus location is null until an admin sets it. */
export interface SystemConfig {
  campusLatitude: number | null;
  campusLongitude: number | null;
  geofenceRadiusMeters: number;
  /** Eligibility threshold for the whole institution, 0 to 100. */
  minAttendancePct: number;
  /** Minutes attendance stays open after a teacher starts it. */
  verificationWindowMin: number;
  saturdayEnabled: boolean;
}
