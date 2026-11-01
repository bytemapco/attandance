import { z } from "zod";

/** Range of the radius slider on the Settings page. */
export const CAMPUS_RADIUS_MIN_METERS = 10;
export const CAMPUS_RADIUS_MAX_METERS = 1000;
export const CAMPUS_RADIUS_STEP_METERS = 10;

export const campusLocationSchema = z.object({
  campusLatitude: z
    .number({ required_error: "Pick the campus on the map", invalid_type_error: "Pick the campus on the map" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  campusLongitude: z
    .number({ required_error: "Pick the campus on the map", invalid_type_error: "Pick the campus on the map" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  geofenceRadiusMeters: z
    .number({ invalid_type_error: "Choose a radius" })
    .min(CAMPUS_RADIUS_MIN_METERS, `Radius must be at least ${CAMPUS_RADIUS_MIN_METERS} meters`)
    .max(CAMPUS_RADIUS_MAX_METERS, `Radius cannot exceed ${CAMPUS_RADIUS_MAX_METERS} meters`),
});

export type CampusLocationFormData = z.infer<typeof campusLocationSchema>;
