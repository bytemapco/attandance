import { describe, expect, it } from "vitest";
import { campusLocationSchema } from "@/lib/validations/campusLocation";

describe("campus location", () => {
  const valid = { campusLatitude: 28.6, campusLongitude: 77.2, geofenceRadiusMeters: 100 };

  it("accepts a point and a radius in range", () => {
    expect(campusLocationSchema.safeParse(valid).success).toBe(true);
  });

  it("asks to pick the campus on the map when the point is missing", () => {
    const result = campusLocationSchema.safeParse({ ...valid, campusLatitude: undefined });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Pick the campus on the map");
  });

  it.each([-91, 91])("rejects a latitude of %i", (campusLatitude) => {
    expect(campusLocationSchema.safeParse({ ...valid, campusLatitude }).success).toBe(false);
  });

  it.each([-181, 181])("rejects a longitude of %i", (campusLongitude) => {
    expect(campusLocationSchema.safeParse({ ...valid, campusLongitude }).success).toBe(false);
  });

  it.each([10, 1000])("accepts a radius of %i m, the ends of the slider", (geofenceRadiusMeters) => {
    expect(campusLocationSchema.safeParse({ ...valid, geofenceRadiusMeters }).success).toBe(true);
  });

  it.each([9, 1001])("rejects a radius of %i m", (geofenceRadiusMeters) => {
    expect(campusLocationSchema.safeParse({ ...valid, geofenceRadiusMeters }).success).toBe(false);
  });
});
