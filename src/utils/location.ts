import type { StreetViewConfidenceLevel } from "../types/streetView";
import { STREET_VIEW_CONFIDENCE_THRESHOLDS } from "../constants/streetView";

export function calculateDistanceMeters(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);

  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return Math.round(earthRadiusMeters * angularDistance);
}

export function getStreetViewConfidenceLevel(
  distanceMeters: number,
): StreetViewConfidenceLevel {
  if (distanceMeters <= STREET_VIEW_CONFIDENCE_THRESHOLDS.high) {
    return "high";
  }

  if (distanceMeters <= STREET_VIEW_CONFIDENCE_THRESHOLDS.medium) {
    return "medium";
  }

  return "low";
}
